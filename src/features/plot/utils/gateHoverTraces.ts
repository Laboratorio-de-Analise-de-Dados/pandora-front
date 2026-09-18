import type { Gate } from "../../../types"
import type { GateShape } from "../hooks/useGateShapes"
import { fmtPct } from "../../../utils/format"
import { GATE_LABEL_COLOR } from "../../../constants/gateColors"

// Nome de trace reservado para as áreas de hover dos gates — nunca aparece
// (o hovertemplate termina com <extra></extra>) e serve para identificar os
// traces em eventos do Plotly se necessário.
const HOVER_TRACE_NAME = "__gate-hover__"

const escapeHtml = (s: string): string =>
	s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** Texto do tooltip: nome + métricas do gate (ou motivo de não-avaliação). */
export const gateHoverTemplate = (gate: Gate): string => {
	const ar = gate.analysis_result?.analysis_result
	const m = ar?.summary_metrics
	const lines = [`<b>${escapeHtml(gate.name)}</b>`]
	if (ar?.applicable === false) {
		const missing = ar.missing_channels?.join(", ")
		lines.push(
			`<i>Não avaliável nesta amostra${missing ? `: sem ${escapeHtml(missing)}` : ""}</i>`,
		)
	} else if (m) {
		lines.push(`Eventos: ${m.count.toLocaleString("pt-BR")}`)
		lines.push(`% do pai: ${fmtPct(m.percent_of_parent_population)}`)
		lines.push(`% do total: ${fmtPct(m.percent_of_total_population)}`)
	} else {
		lines.push("<i>Sem estatísticas</i>")
	}
	return `${lines.join("<br>")}<extra></extra>`
}

const parsePathPoints = (path: string): { xs: number[]; ys: number[] } => {
	const nums = (path.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number)
	return {
		xs: nums.filter((_, i) => i % 2 === 0),
		ys: nums.filter((_, i) => i % 2 === 1),
	}
}

const fillTrace = (
	xs: number[],
	ys: number[],
	hovertemplate: string,
): Plotly.Data => ({
	type: "scatter",
	mode: "lines",
	x: xs,
	y: ys,
	fill: "toself",
	fillcolor: "rgba(0,0,0,0)",
	line: { width: 0, color: "rgba(0,0,0,0)" },
	// Peculiaridade do plotly: com hoveron === "fills" o supplyDefaults ignora
	// o hovertemplate e o tooltip cai no nome do trace. "points+fills" aplica o
	// template tanto na área quanto nos vértices do polígono. A union do
	// Plotly.Data não declara a combinação (válida em runtime) — cast pontual.
	hoveron: "points+fills" as unknown as "fills",
	hovertemplate,
	name: HOVER_TRACE_NAME,
	showlegend: false,
})

const groupByGate = (shapes: GateShape[]): Map<number, GateShape[]> => {
	const byGate = new Map<number, GateShape[]>()
	for (const s of shapes) {
		const group = byGate.get(s._gateId)
		if (group) group.push(s)
		else byGate.set(s._gateId, [s])
	}
	return byGate
}

/**
 * Converte os shapes dos gates em traces transparentes que só existem para o
 * hover: shapes do Plotly não emitem eventos, então cada gate vira um polígono
 * preenchido invisível com `hoveron: "points+fills"` (tooltip em qualquer
 * ponto da área) ou, no caso do quadrante, um marcador invisível no centro
 * da cruz.
 */
export const buildGateHoverTraces = (
	shapes: GateShape[],
	histogramMaxY = 1,
): Plotly.Data[] => {
	const byGate = groupByGate(shapes)

	const traces: Plotly.Data[] = []
	for (const group of byGate.values()) {
		const gate = group[0]._gateData
		const hovertemplate = gateHoverTemplate(gate)

		const pathShape = group.find((s) => s.type === "path" && s.path)
		if (pathShape?.path) {
			const { xs, ys } = parsePathPoints(pathShape.path)
			if (xs.length >= 3) traces.push(fillTrace(xs, ys, hovertemplate))
			continue
		}

		const rect = group.find((s) => s.type === "rect")
		if (rect && typeof rect.x0 === "number" && typeof rect.x1 === "number") {
			// Gate de intervalo (histograma): o shape usa yref "paper" — no trace
			// a banda precisa de limites de dados, então cobre até o pico máximo.
			const [ry0, ry1] =
				rect.yref === "paper"
					? [0, histogramMaxY]
					: [Number(rect.y0), Number(rect.y1)]
			traces.push(
				fillTrace(
					[rect.x0, rect.x1, rect.x1, rect.x0],
					[ry0, ry0, ry1, ry1],
					hovertemplate,
				),
			)
			continue
		}

		// Quadrante: duas linhas "paper" (vertical + horizontal) — um marcador
		// invisível no centro da cruz dá um alvo de hover para as stats.
		const vline = group.find((s) => s.type === "line" && s.yref === "paper")
		const hline = group.find((s) => s.type === "line" && s.xref === "paper")
		if (
			vline &&
			hline &&
			typeof vline.x0 === "number" &&
			typeof hline.y0 === "number"
		) {
			traces.push({
				type: "scatter",
				mode: "markers",
				x: [vline.x0],
				y: [hline.y0],
				marker: { size: 40, opacity: 0 },
				hovertemplate,
				name: HOVER_TRACE_NAME,
				showlegend: false,
			})
		}
	}
	return traces
}

// Nome de trace reservado para os labels de % dentro da região do gate.
const LABEL_TRACE_NAME = "__gate-label__"

// Sinal de cada quadrante nos eixos crus do gate: [xSign, ySign].
const QUADRANT_DIR: Record<string, [number, number]> = {
	Q1: [1, 1],
	Q2: [-1, 1],
	Q3: [-1, -1],
	Q4: [1, -1],
}

/** "P1<br>(94.9%)" — mesmo formato do `label` de shape. */
const gateLabelText = (gate: Gate): string => {
	const percent =
		gate.analysis_result?.analysis_result?.summary_metrics
			?.percent_of_parent_population
	return percent != null
		? `${gate.name}<br>(${(percent * 100).toFixed(1)}%)`
		: gate.name
}

/**
 * Labels de "% do pai" dentro da região de gates que não têm área própria
 * para o `label` de shape — hoje só o quadrante (4 gates dividem a mesma
 * cruz, então cada um rotula a sua região). A posição fica no canto da
 * região (convenção dos softwares de citometria): 3/4 do caminho entre a
 * cruz e a borda do range visível, com margem dos eixos. Eixos "swapped"
 * trocam a direção X↔Y na tela.
 */
const REGION_FRACTION = 0.75
export const buildGateLabelTraces = (
	shapes: GateShape[],
	xRange: number[],
	yRange: number[],
): Plotly.Data[] => {
	const traces: Plotly.Data[] = []
	for (const group of groupByGate(shapes).values()) {
		const gate = group[0]._gateData
		const gc = gate.gate_coordinates
		if (!gc || gc.type !== "quadrant") continue
		const dir = QUADRANT_DIR[gc.quadrant]
		if (!dir) continue

		const vline = group.find((s) => s.type === "line" && s.yref === "paper")
		const hline = group.find((s) => s.type === "line" && s.xref === "paper")
		if (
			!vline ||
			!hline ||
			typeof vline.x0 !== "number" ||
			typeof hline.y0 !== "number"
		)
			continue

		const cx = vline.x0
		const cy = hline.y0
		const swapped = group[0]._swapped
		// Eixo trocado: o X cru passa a controlar o Y da tela (e vice-versa).
		const xDir = swapped ? dir[1] : dir[0]
		const yDir = swapped ? dir[0] : dir[1]
		const xEdge = xDir > 0 ? xRange[1] : xRange[0]
		const yEdge = yDir > 0 ? yRange[1] : yRange[0]
		const lx = cx + (xEdge - cx) * REGION_FRACTION
		const ly = cy + (yEdge - cy) * REGION_FRACTION

		traces.push({
			type: "scatter",
			mode: "text",
			x: [lx],
			y: [ly],
			text: gateLabelText(gate),
			textposition: "middle center",
			textfont: { size: 11, color: GATE_LABEL_COLOR },
			hoverinfo: "skip",
			name: LABEL_TRACE_NAME,
			showlegend: false,
		})
	}
	return traces
}
