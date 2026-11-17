import { describe, expect, it } from "vitest"
import { DENSITY_STOPS } from "./densityRamp"

// Fundos que o primeiro stop precisa se distinguir: papel do tema +
// o cinza claro fixo do poço do plot (PLOT_BG em scatter-plot/index.tsx,
// #E5E5E5 nos dois temas).
const BACKGROUNDS: Record<"light" | "dark", string[]> = {
	light: ["#FAFAFA", "#F4F4F4", "#E5E5E5"],
	dark: ["#161616", "#E5E5E5"],
}

const hexToRgb = (hex: string): [number, number, number] => [
	parseInt(hex.slice(1, 3), 16),
	parseInt(hex.slice(3, 5), 16),
	parseInt(hex.slice(5, 7), 16),
]

const distance = (a: string, b: string): number => {
	const [ar, ag, ab] = hexToRgb(a)
	const [br, bg, bb] = hexToRgb(b)
	return Math.sqrt((ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2)
}

describe("DENSITY_STOPS — primeiro stop visível (FE-50)", () => {
	it.each(["light", "dark"] as const)(
		"%s: stop 0 distinguível do fundo — densidade baixa presente não some",
		(mode) => {
			const [position, color] = DENSITY_STOPS[mode][0]
			expect(position).toBe(0)
			for (const bg of BACKGROUNDS[mode]) {
				expect(distance(color, bg)).toBeGreaterThanOrEqual(60)
			}
		},
	)
})
