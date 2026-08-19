import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { createGate } from "../../../services/gateService"
import type { GateCoordinates, NewGate, PlotViewConfig, Scale } from "../../../types"
import { toRaw } from "../utils/biex"
import type { GateTool, PlotMode } from "./usePlotState"

interface UseGateDrawingParams {
	fileDataId: number
	parentId?: number
	xAxis: string
	yAxis: string
	effXScale: Scale
	effYScale: Scale
	effCof: number
	tool: GateTool
	plotMode: PlotMode
	xScale: Scale
	yScale: Scale
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	cutoff: number
	siblingGateNames: string[]
	loadFile: () => void
	setTool: (t: GateTool) => void
	/** Config de visualização corrente, persistida no gate criado. */
	plotConfig: PlotViewConfig
}

/** Gera o próximo nome de gate no estilo FlowJo: "P1", "P2", ... */
const getNextGateName = (existingNames: ReadonlySet<string>): string => {
	let n = 1
	while (existingNames.has(`P${n}`)) n++
	return `P${n}`
}

const getQuadrantLabels = (n: number): string[] => [
	`Q${n} (X+Y+)`,
	`Q${n} (X-Y+)`,
	`Q${n} (X-Y-)`,
	`Q${n} (X+Y-)`,
]

const getNextQuadrantGroup = (existingNames: ReadonlySet<string>): number => {
	let n = 1
	while (getQuadrantLabels(n).some((label) => existingNames.has(label))) n++
	return n
}

export function useGateDrawing({
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
	plotConfig,
}: UseGateDrawingParams) {
	// Nomes criados localmente, ainda não refletidos na lista vinda do servidor.
	// Evita duplicados quando o usuário cria vários gates antes do refetch.
	const [createdGateNames, setCreatedGateNames] = useState<Set<string>>(new Set())

	const siblingNamesSet = useMemo(
		() => new Set(siblingGateNames),
		[siblingGateNames],
	)

	// Limpa nomes locais que já chegaram via servidor e reseta ao trocar de fonte.
	useEffect(() => {
		setCreatedGateNames((prev) => {
			const next = new Set(prev)
			next.forEach((name) => {
				if (siblingNamesSet.has(name)) next.delete(name)
			})
			return next
		})
	}, [siblingNamesSet])

	useEffect(() => {
		setCreatedGateNames(new Set())
	}, [fileDataId, parentId])

	const existingNames = useMemo(
		() => new Set([...siblingNamesSet, ...createdGateNames]),
		[siblingNamesSet, createdGateNames],
	)

	const createGateDirectly = useCallback(
		async (coords: GateCoordinates) => {
			try {
				const gateName = getNextGateName(existingNames)
				const isInterval = coords.type === "interval"
				const dashName = isInterval
					? `${xAxis} (histogram)`
					: `${xAxis} X ${yAxis}`
				const newGate: NewGate = {
					file_data: fileDataId,
					name: gateName,
					parent: parentId ?? null,
					gate_coordinates: coords,
					dashboard: {
						name: dashName,
						dashboard_config: {
							x_axis_label: xAxis,
							y_axis_label: isInterval ? xAxis : yAxis,
						},
						file_data: fileDataId,
					},
					plot_config: plotConfig,
				}
				await createGate(newGate)
				setCreatedGateNames((prev) => {
					const next = new Set(prev)
					next.add(gateName)
					return next
				})
				loadFile()
			} catch (error: unknown) {
				const err = error as { response?: { data?: unknown }; message?: string }
				const msg = err?.response?.data
					? JSON.stringify(err.response.data)
					: err?.message ?? "Erro desconhecido"
				toast.error(`Erro ao criar gate: ${msg}`, { position: "bottom-right" })
			}
		},
		[fileDataId, parentId, xAxis, yAxis, existingNames, loadFile, plotConfig],
	)

	/** Recebe seleção do Plotly (box/lasso) e converte de espaço exibido para cru. */
	const handleSelectedArea = useCallback(
		async (event: Plotly.PlotSelectionEvent | null) => {
			if (!event) return
			const ev = event as unknown as Record<string, unknown>

			if (tool === "poly" && ev.lassoPoints) {
				const lp = ev.lassoPoints as { x?: number[]; y?: number[] }
				const lx: number[] = lp.x || []
				const ly: number[] = lp.y || []
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
					x_axis: xAxis,
					y_axis: yAxis,
					vertices,
				})
				setTool("rect")
				return
			}

			if (tool === "rect" && ev.range) {
				const range = ev.range as { x: number[]; y: number[] }
				const xs = [toRaw(range.x[0], effXScale, effCof), toRaw(range.x[1], effXScale, effCof)]

				if (plotMode === "histogram") {
					await createGateDirectly({
						type: "interval",
						x_axis: xAxis,
						startX: Math.min(...xs),
						endX: Math.max(...xs),
					})
					return
				}

				const ys = [toRaw(range.y[0], effYScale, effCof), toRaw(range.y[1], effYScale, effCof)]
				await createGateDirectly({
					type: "rectangle",
					x_axis: xAxis,
					y_axis: yAxis,
					startX: Math.min(...xs),
					endX: Math.max(...xs),
					startY: Math.min(...ys),
					endY: Math.max(...ys),
				})
				setTool("rect")
			}
		},
		[tool, plotMode, effXScale, effYScale, effCof, xAxis, yAxis, createGateDirectly, setTool],
	)

	/** Cria 4 gates de quadrante no ponto clicado. */
	const handleQuadrantClick = useCallback(
		async (event: Plotly.PlotMouseEvent | null) => {
			if (tool !== "quad" || plotMode === "histogram") return
			if (!event?.points?.[0]) return
			const pt = event.points[0]
			const cx = toRaw(pt.x as number, effXScale, effCof)
			const cy = toRaw(pt.y as number, effYScale, effCof)

			const n = getNextQuadrantGroup(existingNames)

			const quadrants: Array<{ quadrant: "Q1" | "Q2" | "Q3" | "Q4"; label: string }> = [
				{ quadrant: "Q1", label: `Q${n} (X+Y+)` },
				{ quadrant: "Q2", label: `Q${n} (X-Y+)` },
				{ quadrant: "Q3", label: `Q${n} (X-Y-)` },
				{ quadrant: "Q4", label: `Q${n} (X+Y-)` },
			]
			try {
				const createdLabels: string[] = []
				for (const q of quadrants) {
					const newGate: NewGate = {
						file_data: fileDataId,
						name: q.label,
						parent: parentId ?? null,
						gate_coordinates: {
							type: "quadrant",
							quadrant: q.quadrant,
							x_axis: xAxis,
							y_axis: yAxis,
							center_x: cx,
							center_y: cy,
						},
						dashboard: {
							name: `${xAxis} X ${yAxis}`,
							dashboard_config: {
								x_axis_label: xAxis,
								y_axis_label: yAxis,
							},
							file_data: fileDataId,
						},
						plot_config: plotConfig,
					}
					await createGate(newGate)
					createdLabels.push(q.label)
				}
				setCreatedGateNames((prev) => {
					const next = new Set(prev)
					createdLabels.forEach((name) => next.add(name))
					return next
				})
				loadFile()
			} catch (error: unknown) {
				const err = error as { response?: { data?: unknown }; message?: string }
				const msg = err?.response?.data
					? JSON.stringify(err.response.data)
					: err?.message ?? "Erro desconhecido"
				toast.error(`Erro ao criar quadrante: ${msg}`, { position: "bottom-right" })
			}
		},
		[tool, plotMode, effXScale, effYScale, effCof, xAxis, yAxis, fileDataId, parentId, existingNames, loadFile, plotConfig],
	)

	return { createGateDirectly, handleSelectedArea, handleQuadrantClick }
}
