import { MdCropFree as CropFreeSharpIcon } from "react-icons/md"
import { MdGridOn as HeatmapIcon } from "react-icons/md"
import { MdScatterPlot as DotPlotIcon } from "react-icons/md"
import { MdBarChart as HistogramIcon } from "react-icons/md"
import { MdRefresh as RefreshIcon } from "react-icons/md"
import { MdPentagon as PolygonIcon } from "react-icons/md"
import { MdAddBox as QuadrantIcon } from "react-icons/md"
import { MdNearMe as CursorIcon } from "react-icons/md"

import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Divider,
	Select,
	Slider,
	Button,
	CircularProgress,
	MenuItem,
	Menu,
	ListItemIcon,
	ListItemText,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	SelectChangeEvent,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material"
import { MdExpandMore as ExpandMoreIcon } from "react-icons/md"
import { MdPalette as PaletteIcon, MdEdit as EditIcon, MdDelete as DeleteIcon } from "react-icons/md"
import React, { useCallback, useEffect, useRef, useState } from "react"
import Plot from "react-plotly.js"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import CytometryApi from "../../API"
import { DensityResponse, Gate, GateCoordinates, NewGate, Scale } from "../../types"
import { getGateColor, hexToRgba } from "../../constants/gateColors"
import ColorPicker from "../color_picker"

type PlotMode = "heatmap" | "scatter" | "histogram"
type GateTool = "rect" | "poly" | "quad" | "edit"

const COFACTOR = 150

// arcsinh (biex) e seu inverso, para converter entre espaço cru e exibido.
const toRaw = (v: number, scale: Scale, cof: number): number =>
	scale === "biex" ? Math.sinh(v) * cof : v

const biex = (v: number, cof: number): number => Math.asinh(v / cof)

// FSC/SSC/Time são lineares; demais canais usam biex por padrão (igual ao back).
const defaultScale = (param: string): Scale => {
	const p = param.toLowerCase()
	return p.startsWith("fsc") || p.startsWith("ssc") || p === "time"
		? "linear"
		: "biex"
}

const NICE_RAW = [-100000, -10000, -1000, 0, 1000, 10000, 100000, 1000000]

const SUPERSCRIPTS: Record<string, string> = {
	"0": "\u2070",
	"1": "\u00B9",
	"2": "\u00B2",
	"3": "\u00B3",
	"4": "\u2074",
	"5": "\u2075",
	"6": "\u2076",
	"7": "\u2077",
	"8": "\u2078",
	"9": "\u2079",
}

const toSuperscript = (s: string): string =>
	s
		.split("")
		.map((c) => SUPERSCRIPTS[c] ?? c)
		.join("")

const fmtTick = (raw: number): string => {
	if (raw === 0) return "0"
	const abs = Math.abs(raw)
	const exp = Math.round(Math.log10(abs))
	if (10 ** exp === abs) {
		const sign = raw < 0 ? "-" : ""
		return `${sign}10${toSuperscript(String(exp))}`
	}
	return String(raw)
}

// Em biex, gera ticks em unidades reais posicionados no espaço transformado.
const buildTicks = (
	edges: number[] | undefined,
	scale: Scale,
	cof: number,
): { tickvals: number[]; ticktext: string[] } | undefined => {
	if (scale !== "biex" || !edges || edges.length < 2) return undefined
	const min = edges[0]
	const max = edges[edges.length - 1]
	const tickvals: number[] = []
	const ticktext: string[] = []
	for (const raw of NICE_RAW) {
		const t = biex(raw, cof)
		if (t >= min && t <= max) {
			tickvals.push(t)
			ticktext.push(fmtTick(raw))
		}
	}
	return tickvals.length ? { tickvals, ticktext } : undefined
}

// --- helpers para range sliders ---
const rawToSlider = (raw: number, scale: Scale): number =>
	scale === "biex" ? biex(raw, COFACTOR) : raw

const sliderToRaw = (val: number, scale: Scale): number =>
	scale === "biex" ? Math.round(Math.sinh(val) * COFACTOR) : Math.round(val)

const BIEX_SLIDER_MIN = biex(-100000, COFACTOR)
const BIEX_SLIDER_MAX = biex(1000000, COFACTOR)
const LINEAR_SLIDER_MAX = 262144

const BIEX_SLIDER_MARKS = NICE_RAW.map((raw) => ({
	value: biex(raw, COFACTOR),
	label: fmtTick(raw),
}))

const LINEAR_SLIDER_MARKS = [0, 65000, 130000, 200000, 262144].map((v) => ({
	value: v,
	label: v === 0 ? "0" : `${Math.round(v / 1000)}k`,
}))

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
}

// Converte as bordas (n+1) do histograma em centros (n) para o eixo do heatmap.
const edgesToCenters = (edges?: number[]): number[] => {
	if (!edges || edges.length < 2) return []
	const centers: number[] = []
	for (let i = 0; i < edges.length - 1; i++) {
		centers.push((edges[i] + edges[i + 1]) / 2)
	}
	return centers
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
	onEditGate,
}) => {
	const [y_axix_selector, set_y_axis_selector] = useState("SSC-A")
	const [x_axix_selector, set_x_axis_selector] = useState("FSC-A")
	const [plotMode, setPlotMode] = useState<PlotMode>("scatter")
	const [tool, setTool] = useState<GateTool>("rect")
	const [xScale, setXScale] = useState<Scale>(defaultScale("FSC-A"))
	const [yScale, setYScale] = useState<Scale>(defaultScale("SSC-A"))
	// Cutoff de densidade: bins com contagem <= cutoff somem (transparentes).
	const [cutoff, setCutoff] = useState(0)
	const [xMin, setXMin] = useState("")
	const [xMax, setXMax] = useState("")
	const [yMin, setYMin] = useState("")
	const [yMax, setYMax] = useState("")
	const [selectedGate, setSelectedGate] = useState<Gate | null>(null)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [editGateName, setEditGateName] = useState("")
	const [editGateColor, setEditGateColor] = useState("#0078FF")
	// Context menu state
	const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number; gate: Gate; gateIndex: number } | null>(null)
	// Polygon vertex editing state
	const [editingPolyGate, setEditingPolyGate] = useState<{ gate: Gate; swapped: boolean } | null>(null)
	const [editingVertices, setEditingVertices] = useState<[number, number][]>([])
	const editingVerticesRef = useRef<[number, number][]>([])
	editingVerticesRef.current = editingVertices
	const plotContainerRef = useRef<HTMLDivElement>(null)

	// Auto-generates next gate name: "Gate 1", "Gate 2", ...
	const getNextGateName = (existingNames: string[]): string => {
		let n = 1
		while (existingNames.includes(`Gate ${n}`)) n++
		return `Gate ${n}`
	}

	const queryClient = useQueryClient()

	// Plano D: pede ao back para regenerar o cache (Parquet/Redis) a partir do
	// .fcs original + gates. Ao concluir, descarta o cache local de density.
	const recompute = useMutation({
		mutationFn: async () => {
			await CytometryApi.post(`/experiment/file/${fileDataId}/recompute`)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["density"] })
		},
	})

	// Busca os dados agregados no backend (cacheados pelo React Query enquanto
	// o experimento está aberto). O cálculo pesado fica 100% no back.
	const { data, isLoading, isFetching, isError } = useQuery<DensityResponse>({
		queryKey: [
			"density",
			sourceType,
			sourceId,
			x_axix_selector,
			y_axix_selector,
			plotMode,
			xScale,
			yScale,
			cutoff,
			xMin,
			xMax,
			yMin,
			yMax,
		],
		queryFn: async () => {
			const base =
				sourceType === "file"
					? `/experiment/file/${sourceId}`
					: `/analytics/gate/${sourceId}`
			const params =
				plotMode === "heatmap"
					? `mode=heatmap&bins=200&cutoff=${cutoff}`
					: plotMode === "histogram"
					? "mode=histogram&bins=256"
					: "mode=scatter&sample=5000"
			const scaleParams = `xscale=${xScale}&yscale=${yScale}&cofactor=${COFACTOR}`
			const rangeParams = [
				xMin ? `xmin=${xMin}` : "",
				xMax ? `xmax=${xMax}` : "",
				yMin ? `ymin=${yMin}` : "",
				yMax ? `ymax=${yMax}` : "",
			]
				.filter(Boolean)
				.join("&")
			const qs = [params, scaleParams, rangeParams]
				.filter(Boolean)
				.join("&")
			const res = await CytometryApi.get<DensityResponse>(
				`${base}/density?x=${encodeURIComponent(
					x_axix_selector,
				)}&y=${encodeURIComponent(y_axix_selector)}&${qs}`,
			)
			return res.data
		},
	})

	const handleSelectX = (e: SelectChangeEvent<string>) => {
		if (e.target) {
			set_x_axis_selector(e.target.value)
			setXScale(defaultScale(e.target.value))
		}
	}
	const handleSelectY = (e: SelectChangeEvent<string>) => {
		if (e.target) {
			set_y_axis_selector(e.target.value)
			setYScale(defaultScale(e.target.value))
		}
	}

	const handlePlotMode = (_: React.MouseEvent, mode: PlotMode | null) => {
		if (mode) setPlotMode(mode)
	}

	// Escalas efetivamente usadas no desenho atual (eco do back, com fallback).
	const effXScale: Scale = data?.x_scale ?? xScale
	const effYScale: Scale = data?.y_scale ?? yScale
	const effCof = data?.cofactor ?? COFACTOR

	// Helper to create a gate directly with auto-generated name
	const createGateDirectly = async (coords: GateCoordinates) => {
		try {
			const gateName = getNextGateName(siblingGateNames)
			const isInterval = coords.type === "interval"
			const dashName = isInterval
				? `${x_axix_selector} (histogram)`
				: `${x_axix_selector} X ${y_axix_selector}`
			const newGate: NewGate = {
				file_data: fileDataId,
				name: gateName,
				parent: parentId ?? null,
				gate_coordinates: coords,
				dashboard: {
					name: dashName,
					dashboard_config: {
						x_axis_label: x_axix_selector,
						y_axis_label: isInterval ? x_axix_selector : y_axix_selector,
					},
					file_data: fileDataId,
				},
			}
			await CytometryApi.post("analytics/gate", newGate)
			loadFile()
		} catch (error: any) {
			const msg = error?.response?.data
				? JSON.stringify(error.response.data)
				: error?.message ?? "Erro desconhecido"
			toast.error(`Erro ao criar gate: ${msg}`, { position: "bottom-right" })
		}
	}

	// Recebe seleção do Plotly (box=retângulo, lasso=polígono) e converte os
	// vértices do espaço EXIBIDO (biex) de volta para CRU antes de guardar.
	const handleSelectedArea = async (event: any) => {
		if (!event) return

		if (tool === "poly" && event.lassoPoints) {
			const lx: number[] = event.lassoPoints.x || []
			const ly: number[] = event.lassoPoints.y || []
			if (lx.length < 3) return
			const vertices = lx.map(
				(vx, i) =>
					[
						toRaw(vx, effXScale, effCof),
						toRaw(ly[i], effYScale, effCof),
					] as [number, number],
			)
			await createGateDirectly({
				type: "polygon",
				x_axis: x_axix_selector,
				y_axis: y_axix_selector,
				vertices,
			})
			setTool("rect")
			return
		}

		if (tool === "rect" && event.range) {
			const { x, y } = event.range
			const xs = [toRaw(x[0], effXScale, effCof), toRaw(x[1], effXScale, effCof)]

			// Histogram mode: create 1D interval gate (X-axis only)
			if (plotMode === "histogram") {
				await createGateDirectly({
					type: "interval",
					x_axis: x_axix_selector,
					startX: Math.min(...xs),
					endX: Math.max(...xs),
				})
				return
			}

			const ys = [toRaw(y[0], effYScale, effCof), toRaw(y[1], effYScale, effCof)]
			await createGateDirectly({
				type: "rectangle",
				x_axis: x_axix_selector,
				y_axis: y_axix_selector,
				startX: Math.min(...xs),
				endX: Math.max(...xs),
				startY: Math.min(...ys),
				endY: Math.max(...ys),
			})
			setTool("rect")
		}
	}

	// Quadrant tool: click on plot to place the cross center and auto-create 4 gates
	const handlePlotClick = async (event: any) => {
		if (tool !== "quad" || plotMode === "histogram") return
		if (!event?.points?.[0]) return
		const pt = event.points[0]
		const cx = toRaw(pt.x, effXScale, effCof)
		const cy = toRaw(pt.y, effYScale, effCof)

		// Auto-generate quadrant base number
		let n = 1
		while (siblingGateNames.includes(`Q${n} (X+Y+)`)) n++

		const quadrants: Array<{ quadrant: "Q1" | "Q2" | "Q3" | "Q4"; label: string }> = [
			{ quadrant: "Q1", label: `Q${n} (X+Y+)` },
			{ quadrant: "Q2", label: `Q${n} (X-Y+)` },
			{ quadrant: "Q3", label: `Q${n} (X-Y-)` },
			{ quadrant: "Q4", label: `Q${n} (X+Y-)` },
		]
		try {
			for (const q of quadrants) {
				const newGate: NewGate = {
					file_data: fileDataId,
					name: q.label,
					parent: parentId ?? null,
					gate_coordinates: {
						type: "quadrant",
						quadrant: q.quadrant,
						x_axis: x_axix_selector,
						y_axis: y_axix_selector,
						center_x: cx,
						center_y: cy,
					},
					dashboard: {
						name: `${x_axix_selector} X ${y_axix_selector}`,
						dashboard_config: {
							x_axis_label: x_axix_selector,
							y_axis_label: y_axix_selector,
						},
						file_data: fileDataId,
					},
				}
				await CytometryApi.post("analytics/gate", newGate)
			}
			loadFile()
		} catch (error: any) {
			const msg = error?.response?.data
				? JSON.stringify(error.response.data)
				: error?.message ?? "Erro desconhecido"
			toast.error(`Erro ao criar quadrante: ${msg}`, { position: "bottom-right" })
		}
	}

	// Handler para quando um gate é clicado no gráfico
	const handleGateClick = (gate: Gate) => {
		setSelectedGate(gate)
		setEditGateName(gate.name)
		const idx = childGates.findIndex((g) => g.id === gate.id)
		setEditGateColor(getGateColor(gate.color, idx < 0 ? 0 : idx))
		setEditDialogOpen(true)
	}

	// Context menu: find gate under cursor position
	const findGateAtPoint = (clientX: number, clientY: number): { gate: Gate; gateIndex: number } | null => {
		const container = plotContainerRef.current
		if (!container) return null
		// Get the Plotly plot element to convert pixel → data coords
		const plotEl = container.querySelector(".js-plotly-plot") as any
		if (!plotEl?._fullLayout) return null
		const xaxis = plotEl._fullLayout.xaxis
		const yaxis = plotEl._fullLayout.yaxis
		if (!xaxis || !yaxis) return null
		const rect = plotEl.getBoundingClientRect()
		const px = clientX - rect.left
		const py = clientY - rect.top
		const dataX = xaxis.p2d(px - xaxis._offset)
		const dataY = yaxis.p2d(py - yaxis._offset)
		if (dataX == null || dataY == null) return null

		for (const shape of gateShapes) {
			if (!shape._gateData) continue
			const gc = shape._gateData.gate_coordinates
			const gateType = gc.type ?? "rectangle"
			const swapped = shape._swapped ?? false
			const cof = COFACTOR
			const xs = swapped ? effYScale : effXScale
			const ys = swapped ? effXScale : effYScale

			if (gateType === "rectangle" && "startX" in gc) {
				const x0 = xs === "biex" ? biex(swapped ? gc.startY : gc.startX, cof) : (swapped ? gc.startY : gc.startX)
				const x1 = xs === "biex" ? biex(swapped ? gc.endY : gc.endX, cof) : (swapped ? gc.endY : gc.endX)
				const y0 = ys === "biex" ? biex(swapped ? gc.startX : gc.startY, cof) : (swapped ? gc.startX : gc.startY)
				const y1 = ys === "biex" ? biex(swapped ? gc.endX : gc.endY, cof) : (swapped ? gc.endX : gc.endY)
				const minX = Math.min(x0, x1), maxX = Math.max(x0, x1)
				const minY = Math.min(y0, y1), maxY = Math.max(y0, y1)
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
				const x0 = effXScale === "biex" ? biex(gc.startX, cof) : gc.startX
				const x1 = effXScale === "biex" ? biex(gc.endX, cof) : gc.endX
				const minX = Math.min(x0, x1), maxX = Math.max(x0, x1)
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
			setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, gate: hit.gate, gateIndex: hit.gateIndex })
		}
	}

	const handleContextMenuClose = () => setContextMenu(null)

	const handleContextMenuColor = () => {
		if (!contextMenu) return
		setSelectedGate(contextMenu.gate)
		setEditGateName(contextMenu.gate.name)
		setEditGateColor(getGateColor(contextMenu.gate.color, contextMenu.gateIndex))
		setEditDialogOpen(true)
		setContextMenu(null)
	}

	const handleContextMenuRename = () => {
		if (!contextMenu) return
		setSelectedGate(contextMenu.gate)
		setEditGateName(contextMenu.gate.name)
		setEditGateColor(getGateColor(contextMenu.gate.color, contextMenu.gateIndex))
		setEditDialogOpen(true)
		setContextMenu(null)
	}

	const handleContextMenuDelete = async () => {
		if (!contextMenu) return
		const gate = contextMenu.gate
		setContextMenu(null)
		try {
			await CytometryApi.delete(`/analytics/gate/${gate.id}`)
			toast.success(`Gate "${gate.name}" excluído`, { position: "bottom-right" })
			loadFile()
		} catch (error: any) {
			const msg = error?.response?.data
				? JSON.stringify(error.response.data)
				: error?.message ?? "Erro desconhecido"
			toast.error(`Erro ao excluir gate: ${msg}`, { position: "bottom-right" })
		}
	}

	// Atualizar nome do gate
	const handleSaveGateName = async () => {
		if (!selectedGate || !editGateName.trim()) {
			toast.error("Nome do gate não pode estar vazio", { position: "bottom-right" })
			return
		}

		try {
			await CytometryApi.patch(`/analytics/gate/${selectedGate.id}`, { name: editGateName, color: editGateColor })
			toast.success("Gate atualizado com sucesso!", { position: "bottom-right" })
			setEditDialogOpen(false)
			setSelectedGate(null)
			loadFile()
		} catch (error: any) {
			const msg = error?.response?.data
				? JSON.stringify(error.response.data)
				: error?.message ?? "Erro desconhecido"
			toast.error(`Erro ao atualizar gate: ${msg}`, { position: "bottom-right" })
		}
	}

	// Detecta se os eixos do gate conferem com os seletores (direto ou invertido).
	type AxisMatch = "exact" | "swapped" | "none"
	const matchAxes = (gateX: string | undefined, gateY: string | undefined): AxisMatch => {
		if (!gateX || !gateY) return "none"
		if (gateX === x_axix_selector && gateY === y_axix_selector) return "exact"
		if (gateX === y_axix_selector && gateY === x_axix_selector) return "swapped"
		return "none"
	}

	// Converte child gates em Plotly shapes para exibir no plot.
	const gateShapes: any[] = childGates
		.map((gate, gateIndex) => {
			const gc = gate.gate_coordinates
			if (!gc) return null
			const gateType = gc.type ?? "rectangle"

			if (gateType === "interval" && "x_axis" in gc) {
				if (gc.x_axis === x_axix_selector && plotMode === "histogram") return { gate, swapped: false, gateIndex }
				return null
			}
			if (gateType === "quadrant" && "x_axis" in gc && "y_axis" in gc) {
				const m = matchAxes(gc.x_axis, gc.y_axis)
				if (m !== "none" && plotMode !== "histogram") return { gate, swapped: m === "swapped", gateIndex }
				return null
			}
			// rectangle or polygon
			const xAxis = "x_axis" in gc ? (gc as any).x_axis : undefined
			const yAxis = "y_axis" in gc ? (gc as any).y_axis : undefined
			const m = matchAxes(xAxis, yAxis)
			if (m !== "none" && plotMode !== "histogram") return { gate, swapped: m === "swapped", gateIndex }
			return null
		})
		.filter((item): item is { gate: Gate; swapped: boolean; gateIndex: number } => item !== null)
		.flatMap(({ gate, swapped, gateIndex }): any[] => {
			const gc = gate.gate_coordinates
			const gateType = gc.type ?? "rectangle"
			const cof = COFACTOR

			const color = getGateColor(gate.color, gateIndex)

			// Quando os eixos estão invertidos, troca a escala usada para cada dimensão.
			const xScale = swapped ? effYScale : effXScale
			const yScale = swapped ? effXScale : effYScale

			// Extrair percentual do gate
			const percent = gate.analysis_result?.analysis_result?.summary_metrics?.percent_of_parent_population
			const gateLabel = percent !== undefined && percent !== null
				? `${gate.name}\n(${(percent * 100).toFixed(1)}%)`
				: gate.name

			if (gateType === "rectangle" && "startX" in gc && "startY" in gc) {
				const rawX0 = swapped ? gc.startY : gc.startX
				const rawX1 = swapped ? gc.endY : gc.endX
				const rawY0 = swapped ? gc.startX : gc.startY
				const rawY1 = swapped ? gc.endX : gc.endY
				const x0 = xScale === "biex" ? biex(rawX0, cof) : rawX0
				const x1 = xScale === "biex" ? biex(rawX1, cof) : rawX1
				const y0 = yScale === "biex" ? biex(rawY0, cof) : rawY0
				const y1 = yScale === "biex" ? biex(rawY1, cof) : rawY1
				return [{
					type: "rect",
					x0, x1, y0, y1,
					line: { color: hexToRgba(color, 0.7), width: 2 },
					fillcolor: hexToRgba(color, 0.05),
					label: { text: gateLabel, font: { size: 11, color: hexToRgba(color, 0.9) } },
					_gateId: gate.id,
					_gateData: gate,
					_swapped: swapped,
				}]
			}

			if (gateType === "interval" && "startX" in gc && "endX" in gc) {
				const x0 = effXScale === "biex" ? biex(gc.startX, cof) : gc.startX
				const x1 = effXScale === "biex" ? biex(gc.endX, cof) : gc.endX
				return [
					{ type: "line", x0, x1: x0, y0: 0, y1: 1, yref: "paper", line: { color: hexToRgba(color, 0.7), width: 2 } },
					{ type: "line", x0: x1, x1, y0: 0, y1: 1, yref: "paper", line: { color: hexToRgba(color, 0.7), width: 2 } },
					{ type: "rect", x0, x1, y0: 0, y1: 1, yref: "paper", line: { width: 0 }, fillcolor: hexToRgba(color, 0.08),
					  label: { text: gateLabel, font: { size: 11, color: hexToRgba(color, 0.9) } },
					  _gateId: gate.id,
					  _gateData: gate,
					  _swapped: false,
					},
				]
			}

			if (gateType === "polygon" && "vertices" in gc) {
				const path = gc.vertices
					.map((v: [number, number], i: number) => {
						const rawX = swapped ? v[1] : v[0]
						const rawY = swapped ? v[0] : v[1]
						const px = xScale === "biex" ? biex(rawX, cof) : rawX
						const py = yScale === "biex" ? biex(rawY, cof) : rawY
						return `${i === 0 ? "M" : "L"} ${px} ${py}`
					})
					.join(" ") + " Z"
				return [{
					type: "path",
					path,
					line: { color: hexToRgba(color, 0.7), width: 2 },
					fillcolor: hexToRgba(color, 0.05),
					label: { text: gateLabel, font: { size: 11, color: hexToRgba(color, 0.9) } },
					_gateId: gate.id,
					_gateData: gate,
					_swapped: swapped,
				}]
			}

			if (gateType === "quadrant" && "center_x" in gc && "center_y" in gc) {
				const rawCx = swapped ? gc.center_y : gc.center_x
				const rawCy = swapped ? gc.center_x : gc.center_y
				const cx = xScale === "biex" ? biex(rawCx, cof) : rawCx
				const cy = yScale === "biex" ? biex(rawCy, cof) : rawCy
				return [
					{ type: "line", x0: cx, x1: cx, y0: 0, y1: 1, yref: "paper", line: { color: hexToRgba(color, 0.5), width: 1.5, dash: "dash" } },
					{ type: "line", x0: 0, x1: 1, xref: "paper", y0: cy, y1: cy, line: { color: hexToRgba(color, 0.5), width: 1.5, dash: "dash" } },
				]
			}

			return []
		})

	// Build shape index → gate mapping for edit mode, and set editable flag.
	// Hide the polygon being edited (the SVG overlay replaces it).
	const shapeGateMap = useRef<Array<{ gate: Gate; swapped: boolean } | null>>([])
	const filteredShapes = editingPolyGate
		? gateShapes.filter((s) => !(s._gateData && s._gateData.id === editingPolyGate.gate.id))
		: gateShapes
	const editableShapes = filteredShapes.map((shape, i) => {
		const gateData = shape._gateData ?? null
		const swappedFlag = shape._swapped ?? false
		shapeGateMap.current[i] = gateData ? { gate: gateData, swapped: swappedFlag } : null
		const isEditable = tool === "edit" && shape.type === "rect"
		return { ...shape, editable: isEditable }
	})
	shapeGateMap.current.length = editableShapes.length

	// Handle shape drag/resize in edit mode via Plotly's onRelayout event.
	const handleRelayout = async (relayoutData: Record<string, any>) => {
		if (tool !== "edit") return
		// Plotly emits keys like "shapes[0].x0", "shapes[0].x1", etc.
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
				const x0 = props.x0 ?? shape.x0
				const x1 = props.x1 ?? shape.x1
				const y0 = props.y0 ?? shape.y0
				const y1 = props.y1 ?? shape.y1
				const xSc = swapped ? effYScale : effXScale
				const ySc = swapped ? effXScale : effYScale
				const rawX0 = toRaw(Math.min(x0, x1), xSc, cof)
				const rawX1 = toRaw(Math.max(x0, x1), xSc, cof)
				const rawY0 = toRaw(Math.min(y0, y1), ySc, cof)
				const rawY1 = toRaw(Math.max(y0, y1), ySc, cof)
				const newCoords = {
					type: "rectangle" as const,
					x_axis: (gc as any).x_axis,
					y_axis: (gc as any).y_axis,
					startX: swapped ? rawY0 : rawX0,
					endX: swapped ? rawY1 : rawX1,
					startY: swapped ? rawX0 : rawY0,
					endY: swapped ? rawX1 : rawY1,
				}
				try {
					await CytometryApi.patch(`/analytics/gate/${gate.id}`, { gate_coordinates: newCoords })
					loadFile()
				} catch (error: any) {
					const msg = error?.response?.data
						? JSON.stringify(error.response.data)
						: error?.message ?? "Erro desconhecido"
					toast.error(`Erro ao atualizar gate: ${msg}`, { position: "bottom-right" })
				}
			} else if (gateType === "interval") {
				const shape = editableShapes[idx]
				const x0 = props.x0 ?? shape.x0
				const x1 = props.x1 ?? shape.x1
				const rawX0 = toRaw(Math.min(x0, x1), effXScale, cof)
				const rawX1 = toRaw(Math.max(x0, x1), effXScale, cof)
				const newCoords = {
					type: "interval" as const,
					x_axis: (gc as any).x_axis,
					startX: rawX0,
					endX: rawX1,
				}
				try {
					await CytometryApi.patch(`/analytics/gate/${gate.id}`, { gate_coordinates: newCoords })
					loadFile()
				} catch (error: any) {
					const msg = error?.response?.data
						? JSON.stringify(error.response.data)
						: error?.message ?? "Erro desconhecido"
					toast.error(`Erro ao atualizar gate: ${msg}`, { position: "bottom-right" })
				}
			}
		}
	}

	// Monta os traces do Plotly conforme o modo selecionado.
	const plotData: any[] =
		plotMode === "heatmap"
			? [
					{
						type: "heatmap",
						z: data?.histogram ?? [],
						x: edgesToCenters(data?.x_edges),
						y: edgesToCenters(data?.y_edges),
						colorscale: "Jet",
						showscale: true,
					},
			  ]
			: plotMode === "histogram"
			? [
					{
						type: "bar",
						x: edgesToCenters(data?.edges),
						y: data?.counts ?? [],
						marker: { color: "#1976d2" },
					},
			  ]
			: [
					{
						type: "scattergl",
						mode: "markers",
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

	// Em biex, mapeia os ticks de volta para unidades reais (10², 10³, ...).
	const xRange =
		plotMode === "heatmap"
			? data?.x_edges
			: plotMode === "histogram"
			? data?.edges
			: data?.x && data.x.length
			? [Math.min(...data.x), Math.max(...data.x)]
			: undefined
	const yRange =
		plotMode === "heatmap"
			? data?.y_edges
			: plotMode === "histogram"
			? undefined
			: data?.y && data.y.length
			? [Math.min(...data.y), Math.max(...data.y)]
			: undefined
	// Fixa o range dos eixos. Quando o usuário não define um range manual,
	// usa o range completo do instrumento (linear: 0–262144, biex: -100k–1M)
	// em vez de deixar o Plotly auto-escalar para a faixa dos dados visíveis.
	const defaultXRange = effXScale === "biex"
		? [biex(-100000, effCof), biex(1000000, effCof)]
		: [0, LINEAR_SLIDER_MAX]
	const defaultYRange = effYScale === "biex"
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

	// Ticks: quando o seletor de range está definido, usa o range do seletor
	// para gerar ticks (não o range dos dados retornados).
	const xTickSource = xAxisRange ?? xRange
	const yTickSource = yAxisRange ?? yRange
	const xTicks = buildTicks(xTickSource, effXScale, effCof)
	const yTicks = buildTicks(yTickSource, effYScale, effCof)

	const dragmode: "select" | "lasso" | "pan" | false =
		tool === "edit" ? "pan" : tool === "quad" ? false : tool === "poly" ? "lasso" : "select"

	// Handler para cliques no gráfico que podem ser em shapes
	const handlePlotHover = (event: any) => {
		// Se houver uma shape com _gateData, torná-la clicável
		if (event?.shapes) {
			// O Plotly passa informações de shapes ao hover, mas vamos usar o onClick
		}
	}

	// Wrapper para plotly click que detecta cliques em shapes
	const handlePlotClickWrapper = async (event: any) => {
		// Se estamos em modo quadrante, usar o handler original
		if (tool === "quad" && plotMode !== "histogram") {
			await handlePlotClick(event)
			return
		}

		// In edit mode, clicking on a polygon gate activates vertex editing
		if (tool === "edit" && event?.points?.[0]) {
			const clickPt = event.points[0]
			const clickDataX = clickPt.x as number
			const clickDataY = clickPt.y as number
			// Find polygon gates that contain this click point
			for (const entry of gateShapes) {
				if (!entry._gateData) continue
				const gc = entry._gateData.gate_coordinates
				if (gc.type !== "polygon" || !("vertices" in gc)) continue
				const swapped = entry._swapped ?? false
				// Check if click is inside polygon (ray casting in display space)
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
			// Click outside any polygon → deactivate
			if (editingPolyGate) {
				setEditingPolyGate(null)
				setEditingVertices([])
			}
			return
		}

		// Verificar se clicou em uma shape (gate)
		if (event?.shapes && event.shapes.length > 0) {
			const clickedShape = event.shapes[0]
			if (clickedShape._gateData) {
				handleGateClick(clickedShape._gateData)
				return
			}
		}

		// Comportamento padrão se não clicou em um gate
		await handlePlotClick(event)
	}

	// Deactivate polygon editing when switching tools
	useEffect(() => {
		if (tool !== "edit") {
			setEditingPolyGate(null)
			setEditingVertices([])
		}
	}, [tool])

	// Point-in-polygon test (ray casting)
	const pointInPolygon = (px: number, py: number, verts: [number, number][]): boolean => {
		let inside = false
		const n = verts.length
		for (let i = 0, j = n - 1; i < n; j = i++) {
			const [xi, yi] = verts[i]
			const [xj, yj] = verts[j]
			if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
				inside = !inside
			}
		}
		return inside
	}

	// Convert data coords to pixel coords using Plotly's internal axis objects
	const dataToPixel = useCallback((dataX: number, dataY: number): { px: number; py: number } | null => {
		const container = plotContainerRef.current
		if (!container) return null
		const plotDiv = container.querySelector(".js-plotly-plot") as any
		if (!plotDiv?._fullLayout) return null
		const layout = plotDiv._fullLayout
		const xax = layout.xaxis
		const yax = layout.yaxis
		if (!xax || !yax) return null
		const px = xax.l2p(dataX) + xax._offset
		const py = yax.l2p(dataY) + yax._offset
		return { px, py }
	}, [])

	// Convert pixel coords back to data coords
	const pixelToData = useCallback((px: number, py: number): { dataX: number; dataY: number } | null => {
		const container = plotContainerRef.current
		if (!container) return null
		const plotDiv = container.querySelector(".js-plotly-plot") as any
		if (!plotDiv?._fullLayout) return null
		const layout = plotDiv._fullLayout
		const xax = layout.xaxis
		const yax = layout.yaxis
		if (!xax || !yax) return null
		const dataX = xax.p2l(px - xax._offset)
		const dataY = yax.p2l(py - yax._offset)
		return { dataX, dataY }
	}, [])

	// Save edited polygon vertices to backend
	const savePolygonVertices = useCallback(async (gate: Gate, vertices: [number, number][], swapped: boolean) => {
		const gc = gate.gate_coordinates
		const newCoords = {
			type: "polygon" as const,
			x_axis: (gc as any).x_axis,
			y_axis: (gc as any).y_axis,
			vertices,
		}
		try {
			await CytometryApi.patch(`/analytics/gate/${gate.id}`, { gate_coordinates: newCoords })
			loadFile()
		} catch (error: any) {
			const msg = error?.response?.data
				? JSON.stringify(error.response.data)
				: error?.message ?? "Erro desconhecido"
			toast.error(`Erro ao atualizar gate: ${msg}`, { position: "bottom-right" })
		}
	}, [loadFile])

	// Render polygon vertex handles as an SVG overlay
	const renderPolyEditOverlay = () => {
		if (!editingPolyGate || editingVertices.length === 0) return null
		const { swapped } = editingPolyGate
		const xSc = swapped ? effYScale : effXScale
		const ySc = swapped ? effXScale : effYScale
		const cof = COFACTOR

		// Convert vertices to display coords then to pixel coords
		const pixelVerts = editingVertices.map((v) => {
			const rawX = swapped ? v[1] : v[0]
			const rawY = swapped ? v[0] : v[1]
			const dispX = xSc === "biex" ? biex(rawX, cof) : rawX
			const dispY = ySc === "biex" ? biex(rawY, cof) : rawY
			return dataToPixel(dispX, dispY)
		})

		if (pixelVerts.some((p) => p === null)) return null
		const validVerts = pixelVerts as { px: number; py: number }[]

		// Build polygon path for the overlay preview
		const polyPath = validVerts.map((v, i) => `${i === 0 ? "M" : "L"}${v.px},${v.py}`).join(" ") + " Z"

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
				// Convert display coords back to raw coords
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
				// Save to backend using ref for latest vertices
				savePolygonVertices(editingPolyGate!.gate, editingVerticesRef.current, swapped)
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
				{/* Polygon outline */}
				<path
					d={polyPath}
					fill="rgba(0,120,255,0.05)"
					stroke="rgba(0,120,255,0.9)"
					strokeWidth={2}
					pointerEvents="none"
				/>
				{/* Vertex handles */}
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
		<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
			{/* Toolbar + gráfico */}
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
						width: "fit-content",
						display: "flex",
						alignItems: "center",
						gap: "1rem",
					}}
				>
					<Typography variant="subtitle1">Ferramentas:</Typography>
					<ToggleButtonGroup
						value={tool}
						exclusive
						onChange={(_, v: GateTool | null) => v && setTool(v)}
					>
						<ToggleButton
							value="rect"
							size="small"
							title={plotMode === "histogram" ? "Gate de intervalo (1D)" : "Gate retangular"}
						>
							<CropFreeSharpIcon />
						</ToggleButton>
						{plotMode !== "histogram" && (
							<ToggleButton
								value="poly"
								size="small"
								title="Gate poligonal (laço)"
							>
								<PolygonIcon />
							</ToggleButton>
						)}
						{plotMode !== "histogram" && (
							<ToggleButton
								value="quad"
								size="small"
								title="Gate de quadrante (cruz)"
							>
								<QuadrantIcon />
							</ToggleButton>
						)}
						<ToggleButton
							value="edit"
							size="small"
							title="Editar gate (arrastar/redimensionar)"
						>
							<CursorIcon />
						</ToggleButton>
					</ToggleButtonGroup>
					<ToggleButtonGroup
						value={plotMode}
						exclusive
						onChange={handlePlotMode}
					>
						<ToggleButton
							value="heatmap"
							size="small"
							title="Heatmap (densidade)"
						>
							<HeatmapIcon />
						</ToggleButton>
						<ToggleButton
							value="scatter"
							size="small"
							title="Dot plot (amostra)"
						>
							<DotPlotIcon />
						</ToggleButton>
						<ToggleButton
							value="histogram"
							size="small"
							title="Histograma (distribuição)"
						>
							<HistogramIcon />
						</ToggleButton>
					</ToggleButtonGroup>
					<Button
						size="small"
						variant="outlined"
						startIcon={
							recompute.isPending ? (
								<CircularProgress size={16} />
							) : (
								<RefreshIcon />
							)
						}
						disabled={recompute.isPending}
						onClick={() => recompute.mutate()}
						title="Reprocessar a partir do .fcs original + gates"
					>
						Reprocessar
					</Button>
				</Box>

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
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: "1rem",
						}}
					>
						{plotMode !== "histogram" && (
							<Select
								onChange={handleSelectY}
								value={y_axix_selector}
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
							{isError && !data ? (
								<Typography color="error">
									Erro ao carregar dados.
								</Typography>
							) : hasData ? (
								<Plot
									key={tool === "edit" ? "edit-mode" : "draw-mode"}
									data={plotData}
									config={tool === "edit" ? {
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
								 	} : {
										scrollZoom: false,
										displayModeBar: false,
								 	}}
									layout={{
										dragmode,
										shapes: editableShapes,
										...(plotMode === "histogram" ? { selectdirection: "h" as const } : {}),
										xaxis: {
											title: `${x_axix_selector}${
												effXScale === "biex" ? " (biex)" : ""
											}`,
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
													: `${y_axix_selector}${
															effYScale === "biex"
																? " (biex)"
																: ""
													  }`,
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
									onSelected={handleSelectedArea}
									onClick={handlePlotClickWrapper}
									onHover={handlePlotHover}
									onRelayout={handleRelayout}
								/>
							) : isLoading ? null : (
								<Typography>
									Sem dados para os eixos selecionados.
								</Typography>
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
							{tool === "edit" && renderPolyEditOverlay()}
						</Box>
					</Box>
					<Select value={x_axix_selector} onChange={handleSelectX}>
						{values.map((value, index) => (
							<MenuItem key={index} value={value}>
								{value}
							</MenuItem>
						))}
					</Select>
				</Box>
			</Box>

			{/* Configurações em accordion colapsável abaixo do plot */}
			<Accordion sx={{ width: "100%", maxWidth: 540 }} defaultExpanded={false}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="subtitle2" fontWeight="bold">
						Configurações
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
							<Typography variant="caption" color="text.secondary">
								Escala
							</Typography>
							<ToggleButtonGroup
								value={xScale}
								exclusive
								onChange={(_, v: Scale | null) => v && setXScale(v)}
								size="small"
								fullWidth
							>
								<ToggleButton value="linear" title="Eixo X linear">
									X lin
								</ToggleButton>
								<ToggleButton value="biex" title="Eixo X biex">
									X biex
								</ToggleButton>
							</ToggleButtonGroup>
							{plotMode !== "histogram" && (
								<ToggleButtonGroup
									value={yScale}
									exclusive
									onChange={(_, v: Scale | null) => v && setYScale(v)}
									size="small"
									fullWidth
								>
									<ToggleButton value="linear" title="Eixo Y linear">
										Y lin
									</ToggleButton>
									<ToggleButton value="biex" title="Eixo Y biex">
										Y biex
									</ToggleButton>
								</ToggleButtonGroup>
							)}
						</Box>

						<Divider />

						<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
							<Typography variant="caption" color="text.secondary">
								Eixo X
							</Typography>
							<Slider
								value={[
									xMin !== ""
										? rawToSlider(Number(xMin), xScale)
										: xScale === "biex"
											? BIEX_SLIDER_MIN
											: 0,
									xMax !== ""
										? rawToSlider(Number(xMax), xScale)
										: xScale === "biex"
											? BIEX_SLIDER_MAX
											: LINEAR_SLIDER_MAX,
								]}
								onChange={(_, val) => {
									const [lo, hi] = val as number[]
									setXMin(String(sliderToRaw(lo, xScale)))
									setXMax(String(sliderToRaw(hi, xScale)))
								}}
								min={xScale === "biex" ? BIEX_SLIDER_MIN : 0}
								max={xScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX}
								step={xScale === "biex" ? 0.01 : 500}
								marks={xScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
								valueLabelDisplay="auto"
								valueLabelFormat={(v) => {
									const raw = sliderToRaw(v, xScale)
									return raw === 0 ? "0" : raw.toLocaleString()
								}}
								size="small"
								sx={{
									"& .MuiSlider-markLabel": { fontSize: "0.55rem" },
									mb: 1,
								}}
							/>
							<Box sx={{ display: "flex", gap: "0.5rem" }}>
								<TextField
									label="Min"
									type="number"
									size="small"
									value={xMin}
									onChange={(e) => setXMin(e.target.value)}
									sx={{ flex: 1 }}
								/>
								<TextField
									label="Max"
									type="number"
									size="small"
									value={xMax}
									onChange={(e) => setXMax(e.target.value)}
									sx={{ flex: 1 }}
								/>
							</Box>
						</Box>

						{plotMode !== "histogram" && (
							<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
								<Typography variant="caption" color="text.secondary">
									Eixo Y
								</Typography>
								<Slider
									value={[
										yMin !== ""
											? rawToSlider(Number(yMin), yScale)
											: yScale === "biex"
												? BIEX_SLIDER_MIN
												: 0,
										yMax !== ""
											? rawToSlider(Number(yMax), yScale)
											: yScale === "biex"
												? BIEX_SLIDER_MAX
												: LINEAR_SLIDER_MAX,
									]}
									onChange={(_, val) => {
										const [lo, hi] = val as number[]
										setYMin(String(sliderToRaw(lo, yScale)))
										setYMax(String(sliderToRaw(hi, yScale)))
									}}
									min={yScale === "biex" ? BIEX_SLIDER_MIN : 0}
									max={yScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX}
									step={yScale === "biex" ? 0.01 : 500}
									marks={yScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
									valueLabelDisplay="auto"
									valueLabelFormat={(v) => {
										const raw = sliderToRaw(v, yScale)
										return raw === 0 ? "0" : raw.toLocaleString()
									}}
									size="small"
									sx={{
										"& .MuiSlider-markLabel": { fontSize: "0.55rem" },
										mb: 1,
									}}
								/>
								<Box sx={{ display: "flex", gap: "0.5rem" }}>
									<TextField
										label="Min"
										type="number"
										size="small"
										value={yMin}
										onChange={(e) => setYMin(e.target.value)}
										sx={{ flex: 1 }}
									/>
									<TextField
										label="Max"
										type="number"
										size="small"
										value={yMax}
										onChange={(e) => setYMax(e.target.value)}
										sx={{ flex: 1 }}
									/>
								</Box>
							</Box>
						)}

						{plotMode === "heatmap" && (
							<>
								<Divider />
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										gap: "0.5rem",
									}}
								>
									<Typography variant="caption" color="text.secondary">
										Densidade
									</Typography>
									<TextField
										label="Cutoff"
										type="number"
										size="small"
										value={cutoff}
										onChange={(e) =>
											setCutoff(Math.max(0, Number(e.target.value) || 0))
										}
										inputProps={{ min: 0, step: 1 }}
										fullWidth
										title="Bins com contagem <= cutoff ficam transparentes"
									/>
								</Box>
							</>
						)}
					</Box>
				</AccordionDetails>
			</Accordion>

			{/* Dialog para editar nome do gate */}
			<Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Editar Gate</DialogTitle>
				<DialogContent sx={{ pt: 2 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<ColorPicker value={editGateColor} onChange={setEditGateColor} />
						<TextField
							fullWidth
							label="Nome do Gate"
							value={editGateName}
							onChange={(e) => setEditGateName(e.target.value)}
							placeholder="Digite o novo nome"
							autoFocus
						/>
					</Box>
					{selectedGate?.analysis_result?.analysis_result?.summary_metrics && (
						<Box sx={{ mt: 2, p: 1.5, bgcolor: "background.paper", borderRadius: 1 }}>
							<Typography variant="caption" color="text.secondary">
								Estatísticas:
							</Typography>
							<Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
								<Typography variant="body2">
									<strong>Eventos:</strong> {selectedGate.analysis_result.analysis_result.summary_metrics.count.toLocaleString()}
								</Typography>
								<Typography variant="body2">
									<strong>% do total:</strong> {selectedGate.analysis_result.analysis_result.summary_metrics.percent_of_total_population.toFixed(1)}%
								</Typography>
								<Typography variant="body2">
									<strong>% do pai:</strong> {selectedGate.analysis_result.analysis_result.summary_metrics.percent_of_parent_population.toFixed(1)}%
								</Typography>
							</Box>
						</Box>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
					<Button onClick={handleSaveGateName} variant="contained" color="primary">
						Salvar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Context menu (botão direito) no gate */}
			<Menu
				open={contextMenu !== null}
				onClose={handleContextMenuClose}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
				}
			>
				<MenuItem onClick={handleContextMenuColor}>
					<ListItemIcon><PaletteIcon fontSize="small" /></ListItemIcon>
					<ListItemText>Trocar cor</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleContextMenuRename}>
					<ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
					<ListItemText>Renomear</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleContextMenuDelete}>
					<ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
					<ListItemText>Excluir</ListItemText>
				</MenuItem>
			</Menu>
		</Box>
	)
}

export default ScatterPlot
