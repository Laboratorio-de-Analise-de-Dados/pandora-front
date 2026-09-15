/**
 * Rampa de densidade por modo do tema (FE-26) — fonte única usada pelo
 * Plotly (`plotTraces`) e pelo preview em canvas dos cards (BE-21).
 * Dark: base quase preta soma no canvas e os aglomerados "acendem" em
 * emerald → neon. Light: base clara some no papel e a densidade escurece.
 */
export const DENSITY_STOPS: Record<"light" | "dark", [number, string][]> = {
	dark: [
		[0, "#0B1F17"],
		[0.18, "#064E3B"],
		[0.4, "#047857"],
		[0.62, "#10B981"],
		[0.8, "#34D399"],
		[1, "#D1FAE5"],
	],
	light: [
		[0, "#F4F4F4"],
		[0.18, "#D1FAE5"],
		[0.4, "#6EE7B7"],
		[0.62, "#10B981"],
		[0.8, "#047857"],
		[1, "#064E3B"],
	],
}

const hexToRgb = (hex: string): [number, number, number] => [
	parseInt(hex.slice(1, 3), 16),
	parseInt(hex.slice(3, 5), 16),
	parseInt(hex.slice(5, 7), 16),
]

/** Interpola a rampa: `t` normalizado 0–1 → [r, g, b]. */
export const densityToRgb = (
	t: number,
	mode: "light" | "dark",
): [number, number, number] => {
	const stops = DENSITY_STOPS[mode]
	const clamped = Math.max(0, Math.min(1, t))
	let lo = stops[0]
	let hi = stops[stops.length - 1]
	for (let i = 0; i < stops.length - 1; i++) {
		if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
			lo = stops[i]
			hi = stops[i + 1]
			break
		}
	}
	const span = hi[0] - lo[0]
	const k = span === 0 ? 0 : (clamped - lo[0]) / span
	const a = hexToRgb(lo[1])
	const b = hexToRgb(hi[1])
	return [
		Math.round(a[0] + (b[0] - a[0]) * k),
		Math.round(a[1] + (b[1] - a[1]) * k),
		Math.round(a[2] + (b[2] - a[2]) * k),
	]
}
