import type { Scale } from "../../../types"
import { biex, COFACTOR, logT } from "./biex"
import { fmtTick, NICE_RAW } from "./ticks"

// Limites do eixo: 10⁷ — cobre o CytoFLEX, cujo range vai além do
// 2¹⁸ (262144) típico dos FACS antigos.
export const BIEX_SLIDER_MIN = biex(-100000, COFACTOR)
export const BIEX_SLIDER_MAX = biex(10000000, COFACTOR)
export const LINEAR_SLIDER_MAX = 10000000
// Escala log: o slider anda no espaço transformado (décadas), de 10⁰ a 10⁷.
export const LOG_SLIDER_MIN = 0
export const LOG_SLIDER_MAX = 7

export const rawToSlider = (raw: number, scale: Scale): number =>
	scale === "biex" ? biex(raw, COFACTOR) : scale === "log" ? logT(raw) : raw

export const sliderToRaw = (val: number, scale: Scale): number =>
	scale === "biex"
		? Math.round(Math.sinh(val) * COFACTOR)
		: scale === "log"
			? Math.round(10 ** val)
			: Math.round(val)

export const BIEX_SLIDER_MARKS = NICE_RAW.map((raw) => ({
	value: biex(raw, COFACTOR),
	label: fmtTick(raw),
}))

export const LOG_SLIDER_MARKS = [0, 1, 2, 3, 4, 5, 6, 7].map((e) => ({
	value: e,
	label: fmtTick(10 ** e),
}))

export const LINEAR_SLIDER_MARKS = [0, 2500000, 5000000, 7500000, 10000000].map(
	(v) => ({
		value: v,
		label: v === 0 ? "0" : `${v / 1000000}M`,
	}),
)

/** Min/max/step/marks do slider de limites conforme a escala do eixo. */
export const sliderBounds = (
	scale: Scale,
): {
	min: number
	max: number
	step: number
	marks: { value: number; label: string }[]
} =>
	scale === "biex"
		? {
				min: BIEX_SLIDER_MIN,
				max: BIEX_SLIDER_MAX,
				step: 0.01,
				marks: BIEX_SLIDER_MARKS,
			}
		: scale === "log"
			? {
					min: LOG_SLIDER_MIN,
					max: LOG_SLIDER_MAX,
					step: 0.01,
					marks: LOG_SLIDER_MARKS,
				}
			: {
					min: 0,
					max: LINEAR_SLIDER_MAX,
					step: 500,
					marks: LINEAR_SLIDER_MARKS,
				}
