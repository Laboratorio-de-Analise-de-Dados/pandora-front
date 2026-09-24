import type { DensityResponse } from "../../../types"

/**
 * FE-41 — resposta sintética do preview enquanto o BE-36 (endpoint
 * `compensations/preview`) não existe no backend. Determinística: mesma
 * entrada → mesma saída. O spillover entre os canais escolhidos pros
 * eixos vira correlação diagonal nas populações — o "smear" clássico de
 * compensação errada — então editar a grade muda a figura.
 * Remover quando o backend passar a responder (fallback no service).
 */

const BINS = 60
const RANGE = 100

/** Populações fixas (fração do range) — negativa + positivas + dupla. */
const CLUSTERS = [
	{ x: 0.18, y: 0.2, sx: 0.09, sy: 0.08, amp: 1 },
	{ x: 0.75, y: 0.28, sx: 0.08, sy: 0.07, amp: 0.8 },
	{ x: 0.3, y: 0.72, sx: 0.07, sy: 0.09, amp: 0.65 },
	{ x: 0.7, y: 0.7, sx: 0.06, sy: 0.06, amp: 0.45 },
]

const edges = (): number[] =>
	Array.from({ length: BINS + 1 }, (_, i) => (i * RANGE) / BINS)

const clamp = (v: number, lo: number, hi: number) =>
	Math.min(hi, Math.max(lo, v))

/** Spill residual entre os dois canais → correlação ρ das gaussianas. */
export const previewSpillCorrelation = (
	channels: string[],
	matrix: number[][],
	xAxis: string,
	yAxis: string,
): number => {
	const ix = channels.indexOf(xAxis)
	const iy = channels.indexOf(yAxis)
	if (ix < 0 || iy < 0 || ix === iy) return 0
	// ×2 amplifica pra edições pequenas (~5%) ficarem visíveis no mock.
	return clamp(
		((matrix[ix]?.[iy] ?? 0) + (matrix[iy]?.[ix] ?? 0)) * 2,
		-0.95,
		0.95,
	)
}

export const buildCompensationPreviewMock = ({
	channels,
	matrix,
	xAxis,
	yAxis,
}: {
	channels: string[]
	matrix: number[][]
	xAxis: string
	yAxis: string
}): DensityResponse => {
	const rho = previewSpillCorrelation(channels, matrix, xAxis, yAxis)
	const xs = edges()
	const ys = edges()
	const half = RANGE / BINS / 2
	const denom = 1 - rho * rho

	const histogram = ys.slice(0, BINS).map((y0) => {
		const y = (y0 + half) / RANGE
		return xs.slice(0, BINS).map((x0) => {
			const x = (x0 + half) / RANGE
			return CLUSTERS.reduce((acc, c) => {
				const dx = x - c.x
				const dy = y - c.y
				const z =
					(dx * dx) / (c.sx * c.sx) -
					(2 * rho * dx * dy) / (c.sx * c.sy) +
					(dy * dy) / (c.sy * c.sy)
				return acc + c.amp * Math.exp(-z / (2 * denom))
			}, 0)
		})
	})

	return {
		mode: "heatmap",
		total_events: 52000,
		x_label: xAxis,
		y_label: yAxis,
		histogram,
		x_edges: xs,
		y_edges: ys,
		cutoff: 0,
		x_scale: "biex",
		y_scale: "biex",
		cofactor: 150,
	}
}
