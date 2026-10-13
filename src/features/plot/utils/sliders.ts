import type { Scale } from "../../../types"
import { biex, COFACTOR } from "./biex"
import { fmtTick, NICE_RAW } from "./ticks"

// Limites do eixo: 10⁷ — cobre o CytoFLEX, cujo range vai além do
// 2¹⁸ (262144) típico dos FACS antigos.
export const BIEX_SLIDER_MIN = biex(-100000, COFACTOR)
export const BIEX_SLIDER_MAX = biex(10000000, COFACTOR)
export const LINEAR_SLIDER_MAX = 10000000

export const rawToSlider = (raw: number, scale: Scale): number =>
	scale === "biex" ? biex(raw, COFACTOR) : raw

export const sliderToRaw = (val: number, scale: Scale): number =>
	scale === "biex" ? Math.round(Math.sinh(val) * COFACTOR) : Math.round(val)

export const BIEX_SLIDER_MARKS = NICE_RAW.map((raw) => ({
	value: biex(raw, COFACTOR),
	label: fmtTick(raw),
}))

export const LINEAR_SLIDER_MARKS = [0, 2500000, 5000000, 7500000, 10000000].map(
	(v) => ({
		value: v,
		label: v === 0 ? "0" : `${v / 1000000}M`,
	}),
)
