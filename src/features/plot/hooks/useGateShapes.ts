import { useMemo } from "react"
import type { Gate, Scale } from "../../../types"
import { biex, COFACTOR } from "../utils/biex"
import { getGateColor, hexToRgba } from "../../../constants/gateColors"

type AxisMatch = "exact" | "swapped" | "none"

const matchAxes = (
	gateX: string | undefined,
	gateY: string | undefined,
	xAxis: string,
	yAxis: string,
): AxisMatch => {
	if (!gateX || !gateY) return "none"
	if (gateX === xAxis && gateY === yAxis) return "exact"
	if (gateX === yAxis && gateY === xAxis) return "swapped"
	return "none"
}

export interface GateShape {
	type: string
	x0?: number
	x1?: number
	y0?: number | string
	y1?: number | string
	yref?: string
	xref?: string
	path?: string
	line: { color: string; width: number; dash?: string }
	fillcolor?: string
	label?: { text: string; font: { size: number; color: string } }
	editable?: boolean
	_gateId: number
	_gateData: Gate
	_swapped: boolean
}

interface UseGateShapesParams {
	childGates: Gate[]
	xAxis: string
	yAxis: string
	effXScale: Scale
	effYScale: Scale
	plotMode: string
}

/** Converte child gates em Plotly shapes para exibir no plot. */
export function useGateShapes({
	childGates,
	xAxis,
	yAxis,
	effXScale,
	effYScale,
	plotMode,
}: UseGateShapesParams): GateShape[] {
	return useMemo(() => {
		return childGates
			.map((gate, gateIndex) => {
				const gc = gate.gate_coordinates
				if (!gc) return null
				const gateType = gc.type ?? "rectangle"

				if (gateType === "interval" && "x_axis" in gc) {
					if (gc.x_axis === xAxis && plotMode === "histogram")
						return { gate, swapped: false, gateIndex }
					return null
				}
				if (gateType === "quadrant" && "x_axis" in gc && "y_axis" in gc) {
					const m = matchAxes(gc.x_axis, gc.y_axis, xAxis, yAxis)
					if (m !== "none" && plotMode !== "histogram")
						return { gate, swapped: m === "swapped", gateIndex }
					return null
				}
				const xAx = "x_axis" in gc ? gc.x_axis : undefined
				const yAx = "y_axis" in gc ? gc.y_axis : undefined
				const m = matchAxes(xAx, yAx, xAxis, yAxis)
				if (m !== "none" && plotMode !== "histogram")
					return { gate, swapped: m === "swapped", gateIndex }
				return null
			})
			.filter(
				(item): item is { gate: Gate; swapped: boolean; gateIndex: number } =>
					item !== null,
			)
			.flatMap(({ gate, swapped, gateIndex }): GateShape[] => {
				const gc = gate.gate_coordinates
				const gateType = gc.type ?? "rectangle"
				const cof = COFACTOR
				const color = getGateColor(gate.color, gateIndex)
				const xScale = swapped ? effYScale : effXScale
				const yScale = swapped ? effXScale : effYScale

				const percent =
					gate.analysis_result?.analysis_result?.summary_metrics
						?.percent_of_parent_population
				const gateLabel =
					percent !== undefined && percent !== null
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
					return [
						{
							type: "rect",
							x0,
							x1,
							y0,
							y1,
							line: { color: hexToRgba(color, 0.7), width: 2 },
							fillcolor: hexToRgba(color, 0.05),
							label: {
								text: gateLabel,
								font: { size: 11, color: hexToRgba(color, 0.9) },
							},
							_gateId: gate.id,
							_gateData: gate,
							_swapped: swapped,
						},
					]
				}

				if (gateType === "interval" && "startX" in gc && "endX" in gc) {
					const x0 = effXScale === "biex" ? biex(gc.startX, cof) : gc.startX
					const x1 = effXScale === "biex" ? biex(gc.endX, cof) : gc.endX
					return [
						{
							type: "line",
							x0,
							x1: x0,
							y0: 0,
							y1: 1,
							yref: "paper",
							line: { color: hexToRgba(color, 0.7), width: 2 },
							_gateId: gate.id,
							_gateData: gate,
							_swapped: false,
						},
						{
							type: "line",
							x0: x1,
							x1,
							y0: 0,
							y1: 1,
							yref: "paper",
							line: { color: hexToRgba(color, 0.7), width: 2 },
							_gateId: gate.id,
							_gateData: gate,
							_swapped: false,
						},
						{
							type: "rect",
							x0,
							x1,
							y0: 0,
							y1: 1,
							yref: "paper",
							line: { color: "transparent", width: 0 },
							fillcolor: hexToRgba(color, 0.08),
							label: {
								text: gateLabel,
								font: { size: 11, color: hexToRgba(color, 0.9) },
							},
							_gateId: gate.id,
							_gateData: gate,
							_swapped: false,
						},
					]
				}

				if (gateType === "polygon" && "vertices" in gc) {
					const path =
						gc.vertices
							.map((v: [number, number], i: number) => {
								const rawX = swapped ? v[1] : v[0]
								const rawY = swapped ? v[0] : v[1]
								const px = xScale === "biex" ? biex(rawX, cof) : rawX
								const py = yScale === "biex" ? biex(rawY, cof) : rawY
								return `${i === 0 ? "M" : "L"} ${px} ${py}`
							})
							.join(" ") + " Z"
					return [
						{
							type: "path",
							path,
							line: { color: hexToRgba(color, 0.7), width: 2 },
							fillcolor: hexToRgba(color, 0.05),
							label: {
								text: gateLabel,
								font: { size: 11, color: hexToRgba(color, 0.9) },
							},
							_gateId: gate.id,
							_gateData: gate,
							_swapped: swapped,
						},
					]
				}

				if (
					gateType === "quadrant" &&
					"center_x" in gc &&
					"center_y" in gc
				) {
					const rawCx = swapped ? gc.center_y : gc.center_x
					const rawCy = swapped ? gc.center_x : gc.center_y
					const cx = xScale === "biex" ? biex(rawCx, cof) : rawCx
					const cy = yScale === "biex" ? biex(rawCy, cof) : rawCy
					return [
						{
							type: "line",
							x0: cx,
							x1: cx,
							y0: 0,
							y1: 1,
							yref: "paper",
							line: {
								color: hexToRgba(color, 0.5),
								width: 1.5,
								dash: "dash",
							},
							_gateId: gate.id,
							_gateData: gate,
							_swapped: swapped,
						},
						{
							type: "line",
							x0: 0,
							x1: 1,
							xref: "paper",
							y0: cy,
							y1: cy,
							line: {
								color: hexToRgba(color, 0.5),
								width: 1.5,
								dash: "dash",
							},
							_gateId: gate.id,
							_gateData: gate,
							_swapped: swapped,
						},
					]
				}

				return []
			})
	}, [childGates, xAxis, yAxis, effXScale, effYScale, plotMode])
}
