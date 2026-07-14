import {
	MdOpenWith as ReshapeIcon,
	MdPalette as PaletteIcon,
	MdEdit as EditIcon,
	MdDelete as DeleteIcon,
} from "react-icons/md"
import {
	Box,
	Select,
	Button,
	CircularProgress,
	MenuItem,
	Menu,
	ListItemIcon,
	ListItemText,
	Typography,
	SelectChangeEvent,
} from "@mui/material"
import React, { useCallback, useEffect, useRef, useState } from "react"
import Plot from "react-plotly.js"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import CytometryApi from "../../API"
import { Gate, Scale } from "../../types"
import { getGateColor } from "../../constants/gateColors"

import { usePlotState } from "../../features/plot/hooks/usePlotState"
import { useDensityQuery } from "../../features/plot/hooks/useDensityQuery"
import { useGateDrawing } from "../../features/plot/hooks/useGateDrawing"
import { useGateShapes } from "../../features/plot/hooks/useGateShapes"
import { usePlotPersistence } from "../../features/plot/hooks/usePlotPersistence"
import type { GateShape } from "../../features/plot/hooks/useGateShapes"

import { COFACTOR, biex, toRaw } from "../../features/plot/utils/biex"
import { buildTicks } from "../../features/plot/utils/ticks"
import { LINEAR_SLIDER_MAX } from "../../features/plot/utils/sliders"
import {
	pointInPolygon,
	edgesToCenters,
} from "../../features/plot/utils/geometry"

import PlotSettingsDropdown from "../../features/plot/components/scatter-plot/components/PlotSettingsDropdown"
import GateEditDialog from "../../features/plot/components/scatter-plot/components/GateEditDialog"
import type { PlotViewConfig } from "../../types"

// Dot plot sempre em SVG (scatter). scattergl/WebGL foi removido por falhar em
// produção em alguns navegadores; a amostra é limitada (5000 pts), então o SVG
// dá conta sem o erro "WebGL is not supported".
const SCATTER_TRACE_TYPE: "scattergl" | "scatter" = "scatter"

interface ScatterPlotProps {
	values: string[]
	sourceType: "file" | "gate"
	sourceId: number
	fileDataId: number
	parentId?: number
	loadFile: () => void
	siblingGateNames?: string[]
	childGates?: Gate[]
	onEditGate?: (gate: Gate) => void
	/** Config salva do gate selecionado (plot_config), quando existir. */
	initialConfig?: Partial<PlotViewConfig>
	/** Config corrente herdada (carry-forward), usada quando não há config salva. */
	carryForwardConfig: PlotViewConfig
	/** Propaga a config corrente pro carry-forward em memória. */
	onConfigChange: (config: PlotViewConfig) => void
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
	values,
	sourceType,
	sourceId,
	fileDataId,
	parentId,
	loadFile,
	siblingGateNames = [],
	childGates = [],
	initialConfig,
	carryForwardConfig,
	onConfigChange,
}) => {
	// Semeia o estado com a config salva do gate (se houver), senão com o
	// carry-forward. Como o componente remonta ao trocar de fonte (key), a
	// semente vale como "config inicial daquela população".
	const plotState = usePlotState({ ...carryForwardConfig, ...initialConfig })

	const {
		xAxis,
		yAxis,
		plotMode,
		tool,
		xScale,
		yScale,
		cutoff,
		xMin,
		xMax,
		yMin,
		yMax,
		handleSelectX,
		handleSelectY,
		setXAxis,
		setYAxis,
		setPlotMode,
		setTool,
		setXScale,
		setYScale,
		setCutoff,
		setXMin,
		setXMax,
		setYMin,
		setYMax,
	} = plotState

	usePlotPersistence({
		sourceType,
		sourceId,
		config: { xAxis, yAxis, xScale, yScale, xMin, xMax, yMin, yMax, cutoff, plotMode },
		onPersist: onConfigChange,
	})

	// Gate edit dialog state
	const [selectedGate, setSelectedGate] = useState<Gate | null>(null)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editGateName, setEditGateName] = useState("")
	const [editGateColor, setEditGateColor] = useState("#0078FF")
	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number
		mouseY: number
		gate: Gate
		gateIndex: number
	} | null>(null)
	// Reshape mode
	const [reshapingGateId, setReshapingGateId] = useState<number | null>(null)
	// Polygon vertex editing state
	const [editingPolyGate, setEditingPolyGate] = useState<{
		gate: Gate
		swapped: boolean
	} | null>(null)
	const [editingVertices, setEditingVertices] = useState<[number, number][]>([])
	const editingVerticesRef = useRef<[number, number][]>([])
	editingVerticesRef.current = editingVertices
	const plotContainerRef = useRef<HTMLDivElement>(null)

	const queryClient = useQueryClient()

	const recompute = useMutation({
		mutationFn: async () => {
			await CytometryApi.post(`/experiment/file/${fileDataId}/recompute`)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["density"] })
		},
	})

	const { data, isLoading, isFetching, isError } = useDensityQuery({
		sourceType,
		sourceId,
		xAxis,
		yAxis,
		plotMode,
		xScale,
		yScale,
		cutoff,
		xMin,
		xMax,
		yMin,
		yMax,
	})

	const effXScale: Scale = data?.x_scale ?? xScale
	const effYScale: Scale = data?.y_scale ?? yScale
	const effCof = data?.cofactor ?? COFACTOR

	const { handleSelectedArea, handleQuadrantClick } = useGateDrawing({
		fileDataId,
		parentId,
		xAxis,
		yAxis,
		effXScale,
		effYScale,
		effCof,
		tool,
		plotMode,
		xScale,
		yScale,
		xMin,
		xMax,
		yMin,
		yMax,
		cutoff,
		siblingGateNames,
		loadFile,
		setTool,
		plotConfig: { xAxis, yAxis, xScale, yScale, xMin, xMax, yMin, yMax, cutoff, plotMode },
	})

	const gateShapes = useGateShapes({
		childGates,
		xAxis,
		yAxis,
		effXScale,
		effYScale,
		plotMode,
	})

	// --- Gate click/context menu handlers ---
	const handleGateClick = (gate: Gate) => {
		setSelectedGate(gate)
		setEditGateName(gate.name)
		const idx = childGates.findIndex((g) => g.id === gate.id)
		setEditGateColor(getGateColor(gate.color, idx < 0 ? 0 : idx))
		setEditDialogOpen(true)
	}

	const findGateAtPoint = (
		clientX: number,
		clientY: number,
	): { gate: Gate; gateIndex: number } | null => {
		const container = plotContainerRef.current
		if (!container) return null
		const plotEl = container.querySelector(".js-plotly-plot") as HTMLElement & {
			_fullLayout?: Record<string, Record<string, (v: number) => number>>
		}
		if (!plotEl?._fullLayout) return null
		const xaxis = plotEl._fullLayout.xaxis
		const yaxis = plotEl._fullLayout.yaxis
		if (!xaxis || !yaxis) return null
		const rect = plotEl.getBoundingClientRect()
		const px = clientX - rect.left
		const py = clientY - rect.top
		const xaxisObj = xaxis as unknown as {
			p2d: (v: number) => number
			_offset: number
		}
		const yaxisObj = yaxis as unknown as {
			p2d: (v: number) => number
			_offset: number
		}
		const dataX = xaxisObj.p2d(px - xaxisObj._offset)
		const dataY = yaxisObj.p2d(py - yaxisObj._offset)
		if (dataX == null || dataY == null) return null

		for (const shape of gateShapes) {
			if (!shape._gateData) continue
			const gc = shape._gateData.gate_coordinates
			const gateType = gc.type ?? "rectangle"
			const swapped = shape._swapped ?? false
			const cof = COFACTOR
			const xs = swapped ? effYScale : effXScale
			const ys = swapped ? effXScale : effYScale

			if (gateType === "rectangle" && "startX" in gc && "startY" in gc) {
				const rect = gc as {
					startX: number
					startY: number
					endX: number
					endY: number
				}
				const x0 =
					xs === "biex"
						? biex(swapped ? rect.startY : rect.startX, cof)
						: swapped
							? rect.startY
							: rect.startX
				const x1 =
					xs === "biex"
						? biex(swapped ? rect.endY : rect.endX, cof)
						: swapped
							? rect.endY
							: rect.endX
				const y0 =
					ys === "biex"
						? biex(swapped ? rect.startX : rect.startY, cof)
						: swapped
							? rect.startX
							: rect.startY
				const y1 =
					ys === "biex"
						? biex(swapped ? rect.endX : rect.endY, cof)
						: swapped
							? rect.endX
							: rect.endY
				const minX = Math.min(x0, x1),
					maxX = Math.max(x0, x1)
				const minY = Math.min(y0, y1),
					maxY = Math.max(y0, y1)
				if (dataX >= minX && dataX <= maxX && dataY >= minY && dataY <= maxY) {
					const idx = childGates.findIndex((g) => g.id === shape._gateData.id)
					return { gate: shape._gateData, gateIndex: idx < 0 ? 0 : idx }
				}
			}

			if (gateType === "polygon" && "vertices" in gc) {
				const verts = (gc.vertices as [number, number][]).map((v) => {
					const rawX = swapped ? v[1] : v[0]
					const rawY = swapped ? v[0] : v[1]
					const dx = xs === "biex" ? biex(rawX, cof) : rawX
					const dy = ys === "biex" ? biex(rawY, cof) : rawY
					return [dx, dy] as [number, number]
				})
				if (pointInPolygon(dataX, dataY, verts)) {
					const idx = childGates.findIndex((g) => g.id === shape._gateData.id)
					return { gate: shape._gateData, gateIndex: idx < 0 ? 0 : idx }
				}
			}

			if (gateType === "interval" && "startX" in gc && "endX" in gc) {
				const intv = gc as { startX: number; endX: number }
				const x0 = effXScale === "biex" ? biex(intv.startX, cof) : intv.startX
				const x1 = effXScale === "biex" ? biex(intv.endX, cof) : intv.endX
				const minX = Math.min(x0, x1),
					maxX = Math.max(x0, x1)
				if (dataX >= minX && dataX <= maxX) {
					const idx = childGates.findIndex((g) => g.id === shape._gateData.id)
					return { gate: shape._gateData, gateIndex: idx < 0 ? 0 : idx }
				}
			}
		}
		return null
	}

	const handleContextMenu = (event: React.MouseEvent) => {
		const hit = findGateAtPoint(event.clientX, event.clientY)
		if (hit) {
			event.preventDefault()
			setContextMenu({
				mouseX: event.clientX,
				mouseY: event.clientY,
				gate: hit.gate,
				gateIndex: hit.gateIndex,
			})
		}
	}

	const handleContextMenuClose = () => setContextMenu(null)

	const handleContextMenuColor = () => {
		if (!contextMenu) return
		setSelectedGate(contextMenu.gate)
		setEditGateName(contextMenu.gate.name)
		setEditGateColor(
			getGateColor(contextMenu.gate.color, contextMenu.gateIndex),
		)
		setEditDialogOpen(true)
		setContextMenu(null)
	}

	const handleContextMenuRename = () => {
		if (!contextMenu) return
		setSelectedGate(contextMenu.gate)
		setEditGateName(contextMenu.gate.name)
		setEditGateColor(
			getGateColor(contextMenu.gate.color, contextMenu.gateIndex),
		)
		setEditDialogOpen(true)
		setContextMenu(null)
	}

	const handleContextMenuDelete = async () => {
		if (!contextMenu) return
		const gate = contextMenu.gate
		setContextMenu(null)
		try {
			await CytometryApi.delete(`/analytics/gate/${gate.id}`)
			toast.success(`Gate "${gate.name}" excluído`, {
				position: "bottom-right",
			})
			loadFile()
		} catch (error: unknown) {
			const err = error as { response?: { data?: unknown }; message?: string }
			const msg = err?.response?.data
				? JSON.stringify(err.response.data)
				: (err?.message ?? "Erro desconhecido")
			toast.error(`Erro ao excluir gate: ${msg}`, { position: "bottom-right" })
		}
	}

	const handleContextMenuReshape = () => {
		if (!contextMenu) return
		const gate = contextMenu.gate
		const gc = gate.gate_coordinates
		const gateType = gc.type ?? "rectangle"
		setContextMenu(null)

		if (gateType === "polygon" && "vertices" in gc) {
			const gateShape = gateShapes.find((s) => s._gateData?.id === gate.id)
			const swapped = gateShape?._swapped ?? false
			setEditingPolyGate({ gate, swapped })
			setEditingVertices(gc.vertices as [number, number][])
			setReshapingGateId(gate.id)
		} else {
			setReshapingGateId(gate.id)
		}
	}

	const handleExitReshape = () => {
		setReshapingGateId(null)
		setEditingPolyGate(null)
		setEditingVertices([])
	}

	const handleSaveGateName = async () => {
		if (!selectedGate || !editGateName.trim()) {
			toast.error("Nome do gate não pode estar vazio", {
				position: "bottom-right",
			})
			return
		}
		try {
			await CytometryApi.patch(`/analytics/gate/${selectedGate.id}`, {
				name: editGateName,
				color: editGateColor,
			})
			toast.success("Gate atualizado com sucesso!", {
				position: "bottom-right",
			})
			setEditDialogOpen(false)
			setSelectedGate(null)
			loadFile()
		} catch (error: unknown) {
			const err = error as { response?: { data?: unknown }; message?: string }
			const msg = err?.response?.data
				? JSON.stringify(err.response.data)
				: (err?.message ?? "Erro desconhecido")
			toast.error(`Erro ao atualizar gate: ${msg}`, {
				position: "bottom-right",
			})
		}
	}

	// Build shape index -> gate mapping for edit mode
	const shapeGateMap = useRef<Array<{ gate: Gate; swapped: boolean } | null>>(
		[],
	)
	const filteredShapes = editingPolyGate
		? gateShapes.filter(
				(s) => !(s._gateData && s._gateData.id === editingPolyGate.gate.id),
			)
		: gateShapes
	const editableShapes = filteredShapes.map((shape, i) => {
		const gateData = shape._gateData ?? null
		const swappedFlag = shape._swapped ?? false
		shapeGateMap.current[i] = gateData
			? { gate: gateData, swapped: swappedFlag }
			: null
		const isEditTool = tool === "edit" && shape.type === "rect"
		const isReshaping =
			reshapingGateId !== null &&
			gateData?.id === reshapingGateId &&
			shape.type === "rect"
		return { ...shape, editable: isEditTool || isReshaping }
	})
	shapeGateMap.current.length = editableShapes.length

	// Handle shape drag/resize via Plotly's onRelayout event
	const handleRelayout = async (relayoutData: Record<string, number>) => {
		if (tool !== "edit" && reshapingGateId === null) return
		const shapeUpdates = new Map<number, Record<string, number>>()
		for (const key of Object.keys(relayoutData)) {
			const m = key.match(/^shapes\[(\d+)\]\.(\w+)$/)
			if (!m) continue
			const idx = parseInt(m[1], 10)
			const prop = m[2]
			if (!shapeUpdates.has(idx)) shapeUpdates.set(idx, {})
			shapeUpdates.get(idx)![prop] = relayoutData[key]
		}
		for (const [idx, props] of shapeUpdates) {
			const entry = shapeGateMap.current[idx]
			if (!entry) continue
			const { gate, swapped } = entry
			const gc = gate.gate_coordinates
			const gateType = gc.type ?? "rectangle"
			if (gateType !== "rectangle" && gateType !== "interval") continue
			const cof = COFACTOR

			if (gateType === "rectangle") {
				const shape = editableShapes[idx]
				const x0 = props.x0 ?? (shape.x0 as number)
				const x1 = props.x1 ?? (shape.x1 as number)
				const y0 = props.y0 ?? (shape.y0 as number)
				const y1 = props.y1 ?? (shape.y1 as number)
				const xSc = swapped ? effYScale : effXScale
				const ySc = swapped ? effXScale : effYScale
				const rawX0 = toRaw(Math.min(x0, x1), xSc, cof)
				const rawX1 = toRaw(Math.max(x0, x1), xSc, cof)
				const rawY0 = toRaw(Math.min(y0, y1), ySc, cof)
				const rawY1 = toRaw(Math.max(y0, y1), ySc, cof)
				const xAxisLabel = "x_axis" in gc ? gc.x_axis : undefined
				const yAxisLabel = "y_axis" in gc ? gc.y_axis : undefined
				const newCoords = {
					type: "rectangle" as const,
					x_axis: xAxisLabel,
					y_axis: yAxisLabel,
					startX: swapped ? rawY0 : rawX0,
					endX: swapped ? rawY1 : rawX1,
					startY: swapped ? rawX0 : rawY0,
					endY: swapped ? rawX1 : rawY1,
				}
				try {
					await CytometryApi.patch(`/analytics/gate/${gate.id}`, {
						gate_coordinates: newCoords,
					})
					loadFile()
				} catch (error: unknown) {
					const err = error as {
						response?: { data?: unknown }
						message?: string
					}
					const msg = err?.response?.data
						? JSON.stringify(err.response.data)
						: (err?.message ?? "Erro desconhecido")
					toast.error(`Erro ao atualizar gate: ${msg}`, {
						position: "bottom-right",
					})
				}
			} else if (gateType === "interval") {
				const shape = editableShapes[idx]
				const x0 = props.x0 ?? (shape.x0 as number)
				const x1 = props.x1 ?? (shape.x1 as number)
				const rawX0 = toRaw(Math.min(x0, x1), effXScale, cof)
				const rawX1 = toRaw(Math.max(x0, x1), effXScale, cof)
				const xAxisLabel = "x_axis" in gc ? gc.x_axis : undefined
				const newCoords = {
					type: "interval" as const,
					x_axis: xAxisLabel as string,
					startX: rawX0,
					endX: rawX1,
				}
				try {
					await CytometryApi.patch(`/analytics/gate/${gate.id}`, {
						gate_coordinates: newCoords,
					})
					loadFile()
				} catch (error: unknown) {
					const err = error as {
						response?: { data?: unknown }
						message?: string
					}
					const msg = err?.response?.data
						? JSON.stringify(err.response.data)
						: (err?.message ?? "Erro desconhecido")
					toast.error(`Erro ao atualizar gate: ${msg}`, {
						position: "bottom-right",
					})
				}
			}
		}
	}

	// Build Plotly trace data
	const plotData: Plotly.Data[] =
		plotMode === "heatmap"
			? [
					{
						type: "heatmap" as const,
						z: data?.histogram ?? [],
						x: edgesToCenters(data?.x_edges),
						y: edgesToCenters(data?.y_edges),
						colorscale: "Jet" as const,
						showscale: true,
					},
				]
			: plotMode === "histogram"
				? [
						{
							type: "bar" as const,
							x: edgesToCenters(data?.edges),
							y: data?.counts ?? [],
							marker: { color: "#1976d2" },
						},
					]
				: [
						{
							type: SCATTER_TRACE_TYPE,
							mode: "markers" as const,
							x: data?.x ?? [],
							y: data?.y ?? [],
							marker: { color: "black", size: 2 },
						},
					]

	const hasData =
		plotMode === "heatmap"
			? !!data?.histogram?.length
			: plotMode === "histogram"
				? !!data?.counts?.length
				: !!data?.x?.length

	// Axis ranges and ticks
	const defaultXRange =
		effXScale === "biex"
			? [biex(-100000, effCof), biex(1000000, effCof)]
			: [0, LINEAR_SLIDER_MAX]
	const defaultYRange =
		effYScale === "biex"
			? [biex(-100000, effCof), biex(1000000, effCof)]
			: [0, LINEAR_SLIDER_MAX]
	const xAxisRange =
		xMin !== "" && xMax !== ""
			? effXScale === "biex"
				? [biex(parseFloat(xMin), effCof), biex(parseFloat(xMax), effCof)]
				: [parseFloat(xMin), parseFloat(xMax)]
			: defaultXRange
	const yAxisRange =
		yMin !== "" && yMax !== ""
			? effYScale === "biex"
				? [biex(parseFloat(yMin), effCof), biex(parseFloat(yMax), effCof)]
				: [parseFloat(yMin), parseFloat(yMax)]
			: defaultYRange
	const xTicks = buildTicks(xAxisRange, effXScale, effCof)
	const yTicks = buildTicks(yAxisRange, effYScale, effCof)

	const dragmode: "select" | "lasso" | "pan" | false =
		tool === "edit" || reshapingGateId !== null
			? "pan"
			: tool === "quad"
				? false
				: tool === "poly"
					? "lasso"
					: "select"

	// Plot click handler
	const handlePlotClickWrapper = async (event: Plotly.PlotMouseEvent) => {
		if (tool === "quad" && plotMode !== "histogram") {
			await handleQuadrantClick(event)
			return
		}
		if (tool === "edit" && event?.points?.[0]) {
			const clickPt = event.points[0]
			const clickDataX = clickPt.x as number
			const clickDataY = clickPt.y as number
			for (const entry of gateShapes) {
				if (!entry._gateData) continue
				const gc = entry._gateData.gate_coordinates
				if (gc.type !== "polygon" || !("vertices" in gc)) continue
				const swapped = entry._swapped ?? false
				const verts = (gc.vertices as [number, number][]).map((v) => {
					const rawX = swapped ? v[1] : v[0]
					const rawY = swapped ? v[0] : v[1]
					const xSc = swapped ? effYScale : effXScale
					const ySc = swapped ? effXScale : effYScale
					const dx = xSc === "biex" ? biex(rawX, COFACTOR) : rawX
					const dy = ySc === "biex" ? biex(rawY, COFACTOR) : rawY
					return [dx, dy] as [number, number]
				})
				if (pointInPolygon(clickDataX, clickDataY, verts)) {
					setEditingPolyGate({ gate: entry._gateData, swapped })
					setEditingVertices(gc.vertices as [number, number][])
					return
				}
			}
			if (editingPolyGate) {
				setEditingPolyGate(null)
				setEditingVertices([])
			}
			return
		}
	}

	// Deactivate polygon editing when switching tools
	useEffect(() => {
		if (tool !== "edit" && reshapingGateId === null) {
			setEditingPolyGate(null)
			setEditingVertices([])
		}
	}, [tool, reshapingGateId])

	// Escape key exits reshape mode
	useEffect(() => {
		if (reshapingGateId === null) return
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleExitReshape()
		}
		document.addEventListener("keydown", handleKeyDown)
		return () => document.removeEventListener("keydown", handleKeyDown)
	}, [reshapingGateId])

	// Convert data coords to pixel coords
	const dataToPixel = useCallback(
		(dataX: number, dataY: number): { px: number; py: number } | null => {
			const container = plotContainerRef.current
			if (!container) return null
			const plotDiv = container.querySelector(
				".js-plotly-plot",
			) as HTMLElement & {
				_fullLayout?: Record<string, Record<string, unknown>>
			}
			if (!plotDiv?._fullLayout) return null
			const layout = plotDiv._fullLayout
			const xax = layout.xaxis as Record<string, unknown>
			const yax = layout.yaxis as Record<string, unknown>
			if (!xax || !yax) return null
			const px =
				(xax.l2p as (v: number) => number)(dataX) + (xax._offset as number)
			const py =
				(yax.l2p as (v: number) => number)(dataY) + (yax._offset as number)
			return { px, py }
		},
		[],
	)

	const pixelToData = useCallback(
		(px: number, py: number): { dataX: number; dataY: number } | null => {
			const container = plotContainerRef.current
			if (!container) return null
			const plotDiv = container.querySelector(
				".js-plotly-plot",
			) as HTMLElement & {
				_fullLayout?: Record<string, Record<string, unknown>>
			}
			if (!plotDiv?._fullLayout) return null
			const layout = plotDiv._fullLayout
			const xax = layout.xaxis as Record<string, unknown>
			const yax = layout.yaxis as Record<string, unknown>
			if (!xax || !yax) return null
			const dataX = (xax.p2l as (v: number) => number)(
				px - (xax._offset as number),
			)
			const dataY = (yax.p2l as (v: number) => number)(
				py - (yax._offset as number),
			)
			return { dataX, dataY }
		},
		[],
	)

	// Save edited polygon vertices
	const savePolygonVertices = useCallback(
		async (gate: Gate, vertices: [number, number][]) => {
			const gc = gate.gate_coordinates
			const xAxisLabel = "x_axis" in gc ? gc.x_axis : undefined
			const yAxisLabel = "y_axis" in gc ? gc.y_axis : undefined
			const newCoords = {
				type: "polygon" as const,
				x_axis: xAxisLabel,
				y_axis: yAxisLabel,
				vertices,
			}
			try {
				await CytometryApi.patch(`/analytics/gate/${gate.id}`, {
					gate_coordinates: newCoords,
				})
				loadFile()
			} catch (error: unknown) {
				const err = error as { response?: { data?: unknown }; message?: string }
				const msg = err?.response?.data
					? JSON.stringify(err.response.data)
					: (err?.message ?? "Erro desconhecido")
				toast.error(`Erro ao atualizar gate: ${msg}`, {
					position: "bottom-right",
				})
			}
		},
		[loadFile],
	)

	// Render polygon vertex handles as SVG overlay
	const renderPolyEditOverlay = () => {
		if (!editingPolyGate || editingVertices.length === 0) return null
		const { swapped } = editingPolyGate
		const xSc = swapped ? effYScale : effXScale
		const ySc = swapped ? effXScale : effYScale
		const cof = COFACTOR

		const pixelVerts = editingVertices.map((v) => {
			const rawX = swapped ? v[1] : v[0]
			const rawY = swapped ? v[0] : v[1]
			const dispX = xSc === "biex" ? biex(rawX, cof) : rawX
			const dispY = ySc === "biex" ? biex(rawY, cof) : rawY
			return dataToPixel(dispX, dispY)
		})

		if (pixelVerts.some((p) => p === null)) return null
		const validVerts = pixelVerts as { px: number; py: number }[]
		const polyPath =
			validVerts
				.map((v, i) => `${i === 0 ? "M" : "L"}${v.px},${v.py}`)
				.join(" ") + " Z"

		const handleVertexDrag = (idx: number) => (e: React.MouseEvent) => {
			e.preventDefault()
			e.stopPropagation()
			const container = plotContainerRef.current
			if (!container) return
			const containerRect = container.getBoundingClientRect()

			const onMouseMove = (me: MouseEvent) => {
				const relX = me.clientX - containerRect.left
				const relY = me.clientY - containerRect.top
				const dataCoords = pixelToData(relX, relY)
				if (!dataCoords) return
				const rawX = toRaw(dataCoords.dataX, xSc, cof)
				const rawY = toRaw(dataCoords.dataY, ySc, cof)
				setEditingVertices((prev) => {
					const next = [...prev] as [number, number][]
					next[idx] = swapped ? [rawY, rawX] : [rawX, rawY]
					return next
				})
			}

			const onMouseUp = () => {
				document.removeEventListener("mousemove", onMouseMove)
				document.removeEventListener("mouseup", onMouseUp)
				savePolygonVertices(editingPolyGate!.gate, editingVerticesRef.current)
			}

			document.addEventListener("mousemove", onMouseMove)
			document.addEventListener("mouseup", onMouseUp)
		}

		return (
			<svg
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					pointerEvents: "none",
					zIndex: 10,
				}}
			>
				<path
					d={polyPath}
					fill="rgba(0,120,255,0.05)"
					stroke="rgba(0,120,255,0.9)"
					strokeWidth={2}
					pointerEvents="none"
				/>
				{validVerts.map((v, i) => (
					<circle
						key={i}
						cx={v.px}
						cy={v.py}
						r={6}
						fill="white"
						stroke="rgba(0,120,255,0.9)"
						strokeWidth={2}
						style={{ cursor: "grab", pointerEvents: "all" }}
						onMouseDown={handleVertexDrag(i)}
					/>
				))}
			</svg>
		)
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "0.75rem",
			}}
		>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "0.75rem",
				}}
			>
				{data && (
					<Typography variant="caption" color="text.secondary">
						{data.total_events.toLocaleString()} eventos
						{plotMode === "scatter" && data.sampled_events
							? ` · amostra de ${data.sampled_events.toLocaleString()}`
							: plotMode === "histogram"
								? " · histograma (100% dos dados)"
								: " · heatmap (100% dos dados)"}
					</Typography>
				)}

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
						{plotMode !== "histogram" && (
							<Select
								onChange={(e: SelectChangeEvent<string>) =>
									handleSelectY(e.target.value)
								}
								value={yAxis}
								sx={{ transform: "rotate(-90deg)" }}
							>
								{values.map((value, index) => (
									<MenuItem key={index} value={value}>
										{value}
									</MenuItem>
								))}
							</Select>
						)}
						<Box
							ref={plotContainerRef}
							onContextMenu={handleContextMenu}
							sx={{
								width: 500,
								height: 500,
								position: "relative",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{/* Dropdown de configurações, ancorado ao próprio gráfico */}
							<PlotSettingsDropdown
								plotMode={plotMode}
								xScale={xScale}
								yScale={yScale}
								cutoff={cutoff}
								xMin={xMin}
								xMax={xMax}
								yMin={yMin}
								yMax={yMax}
								onXScaleChange={setXScale}
								onYScaleChange={setYScale}
								onCutoffChange={setCutoff}
								onXMinChange={setXMin}
								onXMaxChange={setXMax}
								onYMinChange={setYMin}
								onYMaxChange={setYMax}
								onPlotModeChange={setPlotMode}
							/>
							{isError && !data ? (
								<Typography color="error">Erro ao carregar dados.</Typography>
							) : hasData ? (
								<Plot
									key={
										tool === "edit" || reshapingGateId !== null
											? "edit-mode"
											: "draw-mode"
									}
									data={plotData}
									config={
										tool === "edit" || reshapingGateId !== null
											? {
													scrollZoom: false,
													displayModeBar: false,
													edits: {
														shapePosition: true,
														annotationPosition: false,
														annotationTail: false,
														annotationText: false,
														axisTitleText: false,
														colorbarPosition: false,
														colorbarTitleText: false,
														legendPosition: false,
														legendText: false,
														titleText: false,
													},
												}
											: { scrollZoom: false, displayModeBar: false }
									}
									layout={{
										dragmode,
										shapes: editableShapes as Plotly.Layout["shapes"],
										...(plotMode === "histogram"
											? { selectdirection: "h" as const }
											: {}),
										xaxis: {
											title: `${xAxis}${effXScale === "biex" ? " (biex)" : ""}`,
											...(xTicks
												? {
														tickmode: "array" as const,
														tickvals: xTicks.tickvals,
														ticktext: xTicks.ticktext,
													}
												: {}),
											range: xAxisRange,
											autorange: false,
											fixedrange: true,
										},
										yaxis: {
											title:
												plotMode === "histogram"
													? "Contagem"
													: `${yAxis}${effYScale === "biex" ? " (biex)" : ""}`,
											...(plotMode !== "histogram" && yTicks
												? {
														tickmode: "array" as const,
														tickvals: yTicks.tickvals,
														ticktext: yTicks.ticktext,
													}
												: {}),
											...(plotMode !== "histogram"
												? { range: yAxisRange, autorange: false }
												: {}),
											fixedrange: true,
										},
										width: 500,
										height: 500,
										plot_bgcolor: "#FFFFFF",
										paper_bgcolor: "#FFFFFF",
										bargap: 0,
									}}
									onSelected={
										handleSelectedArea as (
											event: Readonly<Plotly.PlotSelectionEvent>,
										) => void
									}
									onClick={handlePlotClickWrapper}
									onRelayout={
										handleRelayout as unknown as (
											event: Readonly<Plotly.PlotRelayoutEvent>,
										) => void
									}
								/>
							) : isLoading ? null : (
								<Typography>Sem dados para os eixos selecionados.</Typography>
							)}
							{(isLoading || isFetching) && (
								<Box
									sx={{
										position: "absolute",
										inset: 0,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: "rgba(255,255,255,0.6)",
										zIndex: 20,
									}}
								>
									<CircularProgress />
								</Box>
							)}
							{(tool === "edit" || reshapingGateId !== null) &&
								renderPolyEditOverlay()}
							{reshapingGateId !== null && (
								<Box
									sx={{ position: "absolute", top: 8, right: 8, zIndex: 30 }}
								>
									<Button
										variant="contained"
										size="small"
										onClick={handleExitReshape}
									>
										Concluir
									</Button>
								</Box>
							)}
						</Box>
					</Box>
					<Select
						value={xAxis}
						onChange={(e: SelectChangeEvent<string>) =>
							handleSelectX(e.target.value)
						}
					>
						{values.map((value, index) => (
							<MenuItem key={index} value={value}>
								{value}
							</MenuItem>
						))}
					</Select>
				</Box>
			</Box>

			<GateEditDialog
				open={editDialogOpen}
				gate={selectedGate}
				name={editGateName}
				color={editGateColor}
				onNameChange={setEditGateName}
				onColorChange={setEditGateColor}
				onSave={handleSaveGateName}
				onClose={() => setEditDialogOpen(false)}
			/>

			<Menu
				open={contextMenu !== null}
				onClose={handleContextMenuClose}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu
						? { top: contextMenu.mouseY, left: contextMenu.mouseX }
						: undefined
				}
			>
				<MenuItem onClick={handleContextMenuReshape}>
					<ListItemIcon>
						<ReshapeIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Redimensionar</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleContextMenuColor}>
					<ListItemIcon>
						<PaletteIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Trocar cor</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleContextMenuRename}>
					<ListItemIcon>
						<EditIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Renomear</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleContextMenuDelete}>
					<ListItemIcon>
						<DeleteIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Excluir</ListItemText>
				</MenuItem>
			</Menu>
		</Box>
	)
}

export default ScatterPlot
