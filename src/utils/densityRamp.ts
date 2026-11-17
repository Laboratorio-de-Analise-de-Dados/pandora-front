/**
 * Rampa de densidade por modo do tema (FE-26) — fonte única usada pelo
 * Plotly (`plotTraces`) e pelo preview em canvas dos cards (BE-21).
 *
 * Paleta clássica de citometria (jet adaptado): azul → ciano → amarelo →
 * vermelho conforme a densidade sobe. O primeiro stop é um azul presente
 * nos dois temas (FE-50): densidade baixa *presente* se distingue do
 * fundo — quem some são só os bins null (abaixo do cutoff, transparentes).
 */
export const DENSITY_STOPS: Record<"light" | "dark", [number, string][]> = {
	dark: [
		// FE-50: azul frio presente — antes quase-fundo (#0B1026), o ponto
		// de baixa densidade sumia; continua azul na base da rampa.
		[0, "#2547D9"],
		[0.15, "#0018A8"],
		[0.35, "#0047FF"],
		[0.55, "#00D4FF"],
		[0.75, "#FFE600"],
		[0.9, "#FF7A00"],
		[1, "#FF1A1A"],
	],
	light: [
		// FE-50: azul visível sobre o papel claro — antes #F4F6FF ≈ fundo.
		[0, "#8FA8FA"],
		[0.15, "#C9D8FF"],
		[0.35, "#3D6BFE"],
		[0.55, "#00C4E6"],
		[0.75, "#FFD500"],
		[0.9, "#FF7A00"],
		[1, "#E60000"],
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
