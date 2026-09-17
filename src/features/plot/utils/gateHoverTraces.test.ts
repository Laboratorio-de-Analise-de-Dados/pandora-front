import { describe, expect, it } from "vitest"
import { buildGateHoverTraces, gateHoverTemplate } from "./gateHoverTraces"
import type { Gate } from "../../../types"
import type { GateShape } from "../hooks/useGateShapes"

const makeGate = (over: Partial<Gate> = {}): Gate => ({
	id: 1,
	name: "CD3+",
	parent_id: null,
	gate_coordinates: {
		type: "rectangle",
		x_axis: "FSC-A",
		y_axis: "SSC-A",
		startX: 0,
		endX: 10,
		startY: 0,
		endY: 10,
	},
	file_data: 7,
	dashboard: 1,
	...over,
})

const makeShape = (over: Partial<GateShape>): GateShape => ({
	type: "rect",
	line: { color: "#fff", width: 2 },
	_gateId: 1,
	_gateData: makeGate(),
	_swapped: false,
	...over,
})

describe("gateHoverTemplate", () => {
	it("inclui nome e métricas quando há analysis_result", () => {
		const gate = makeGate({
			analysis_result: {
				analysis_result: {
					summary_metrics: {
						count: 12345,
						percent_of_parent_population: 0.452,
						percent_of_total_population: 0.123,
					},
				},
			},
		})
		const tpl = gateHoverTemplate(gate)
		expect(tpl).toContain("CD3+")
		expect(tpl).toContain("Eventos:")
		expect(tpl).toContain("45.20%")
		expect(tpl).toContain("12.30%")
		expect(tpl).toContain("<extra></extra>")
	})

	it("marca gate não-avaliável com canais ausentes", () => {
		const gate = makeGate({
			analysis_result: {
				analysis_result: {
					applicable: false,
					missing_channels: ["PE"],
				},
			},
		})
		expect(gateHoverTemplate(gate)).toContain("Não avaliável")
	})

	it("escapa HTML no nome do gate", () => {
		const tpl = gateHoverTemplate(makeGate({ name: "a<b" }))
		expect(tpl).toContain("a&lt;b")
		expect(tpl).not.toContain("a<b")
	})
})

interface HoverTrace {
	x?: number[]
	y?: number[]
	hoveron?: string
	fill?: string
	mode?: string
	showlegend?: boolean
}

const asHoverTrace = (t: Plotly.Data): HoverTrace => t as unknown as HoverTrace

describe("buildGateHoverTraces", () => {
	it("retângulo vira trace de fill com hoveron points+fills", () => {
		const shapes = [makeShape({ x0: 1, x1: 5, y0: 2, y1: 8 })]
		const traces = buildGateHoverTraces(shapes)
		expect(traces).toHaveLength(1)
		const t = asHoverTrace(traces[0])
		expect(t.hoveron).toBe("points+fills")
		expect(t.fill).toBe("toself")
		expect(t.x).toEqual([1, 5, 5, 1])
		expect(t.y).toEqual([2, 2, 8, 8])
		expect(t.showlegend).toBe(false)
	})

	it("rect com yref paper (intervalo) usa histogramMaxY", () => {
		const shapes = [
			makeShape({ type: "line", x0: 3, x1: 3, y0: 0, y1: 1, yref: "paper" }),
			makeShape({ type: "line", x0: 9, x1: 9, y0: 0, y1: 1, yref: "paper" }),
			makeShape({ x0: 3, x1: 9, y0: 0, y1: 1, yref: "paper" }),
		]
		const traces = buildGateHoverTraces(shapes, 500)
		expect(traces).toHaveLength(1)
		const t = asHoverTrace(traces[0])
		expect(t.x).toEqual([3, 9, 9, 3])
		expect(t.y).toEqual([0, 0, 500, 500])
	})

	it("path (polígono) vira fill com os vértices parseados", () => {
		const shapes = [makeShape({ type: "path", path: "M 1 2 L 5 2 L 5 6 Z" })]
		const traces = buildGateHoverTraces(shapes)
		expect(traces).toHaveLength(1)
		const t = asHoverTrace(traces[0])
		expect(t.x).toEqual([1, 5, 5])
		expect(t.y).toEqual([2, 2, 6])
	})

	it("quadrante (2 linhas paper) vira marcador invisível no centro", () => {
		const shapes = [
			makeShape({ type: "line", x0: 4, x1: 4, y0: 0, y1: 1, yref: "paper" }),
			makeShape({ type: "line", x0: 0, x1: 1, xref: "paper", y0: 7, y1: 7 }),
		]
		const traces = buildGateHoverTraces(shapes)
		expect(traces).toHaveLength(1)
		const t = asHoverTrace(traces[0])
		expect(t.x).toEqual([4])
		expect(t.y).toEqual([7])
		expect(t.mode).toBe("markers")
	})

	it("gates diferentes geram traces separados", () => {
		const g2 = makeGate({ id: 2, name: "CD4+" })
		const shapes = [
			makeShape({ x0: 0, x1: 1, y0: 0, y1: 1 }),
			makeShape({ _gateId: 2, _gateData: g2, x0: 2, x1: 3, y0: 2, y1: 3 }),
		]
		expect(buildGateHoverTraces(shapes)).toHaveLength(2)
	})
})
