import { describe, expect, it } from "vitest"
import {
	buildGateHoverTraces,
	buildGateLabelTraces,
	gateHoverTemplate,
} from "./gateHoverTraces"
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

interface LabelTrace {
	x?: number[]
	y?: number[]
	text?: string
	mode?: string
	hoverinfo?: string
}

const asLabelTrace = (t: Plotly.Data): LabelTrace => t as unknown as LabelTrace

const quadGate = (
	quadrant: "Q1" | "Q2" | "Q3" | "Q4",
	over: Partial<Gate> = {},
): Gate =>
	makeGate({
		gate_coordinates: {
			type: "quadrant",
			quadrant,
			x_axis: "FSC-A",
			y_axis: "SSC-A",
			center_x: 4,
			center_y: 7,
		},
		analysis_result: {
			analysis_result: {
				summary_metrics: {
					count: 100,
					percent_of_parent_population: 0.25,
					percent_of_total_population: 0.25,
				},
			},
		},
		...over,
	})

// Cruz em (4,7) num plot de range [0,10]×[0,10].
const quadShapes = (gate: Gate, swapped = false): GateShape[] => [
	makeShape({
		type: "line",
		x0: 4,
		x1: 4,
		y0: 0,
		y1: 1,
		yref: "paper",
		_gateData: gate,
		_swapped: swapped,
	}),
	makeShape({
		type: "line",
		x0: 0,
		x1: 1,
		xref: "paper",
		y0: 7,
		y1: 7,
		_gateData: gate,
		_swapped: swapped,
	}),
]

describe("buildGateLabelTraces", () => {
	const RANGE = [0, 10]

	it("posiciona o texto no centro da região de cada quadrante", () => {
		const expected: Record<string, [number, number]> = {
			Q1: [7, 8.5], // X+ Y+ → direita/cima
			Q2: [2, 8.5], // X- Y+ → esquerda/cima
			Q3: [2, 3.5], // X- Y- → esquerda/baixo
			Q4: [7, 3.5], // X+ Y- → direita/baixo
		}
		for (const [q, [ex, ey]] of Object.entries(expected)) {
			const gate = quadGate(q as "Q1")
			const traces = buildGateLabelTraces(quadShapes(gate), RANGE, RANGE)
			expect(traces).toHaveLength(1)
			const t = asLabelTrace(traces[0])
			expect(t.x).toEqual([ex])
			expect(t.y).toEqual([ey])
			expect(t.mode).toBe("text")
			expect(t.hoverinfo).toBe("skip")
		}
	})

	it("eixos trocados invertem a direção da região (Q2 ↔ Q4)", () => {
		const gate = quadGate("Q2") // X- Y+ → troca vira direita/baixo
		const traces = buildGateLabelTraces(quadShapes(gate, true), RANGE, RANGE)
		const t = asLabelTrace(traces[0])
		expect(t.x).toEqual([7])
		expect(t.y).toEqual([3.5])
	})

	it("texto traz nome e % do pai", () => {
		const traces = buildGateLabelTraces(
			quadShapes(quadGate("Q1", { name: "Q1 (X+Y+)" })),
			RANGE,
			RANGE,
		)
		expect(asLabelTrace(traces[0]).text).toBe("Q1 (X+Y+)<br>(25.0%)")
	})

	it("sem métricas, mostra só o nome", () => {
		const gate = quadGate("Q1", { analysis_result: undefined })
		const traces = buildGateLabelTraces(quadShapes(gate), RANGE, RANGE)
		expect(asLabelTrace(traces[0]).text).toBe("CD3+")
	})

	it("ignora gates que não são quadrante", () => {
		expect(buildGateLabelTraces([makeShape({})], RANGE, RANGE)).toHaveLength(0)
	})
})
