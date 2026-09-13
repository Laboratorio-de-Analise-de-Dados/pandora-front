import type { Scale } from "../../../types"
import { biex, COFACTOR } from "./biex"
import { fmtTick, NICE_RAW } from "./ticks"

export const BIEX_SLIDER_MIN = biex(-100000, COFACTOR)
export const BIEX_SLIDER_MAX = biex(1000000, COFACTOR)
export const LINEAR_SLIDER_MAX = 262144

export const rawToSlider = (raw: number, scale: Scale): number =>
	scale === "biex" ? biex(raw, COFACTOR) : raw

export const sliderToRaw = (val: number, scale: Scale): number =>
	scale === "biex" ? Math.round(Math.sinh(val) * COFACTOR) : Math.round(val)

export const BIEX_SLIDER_MARKS = NICE_RAW.map((raw) => ({
	value: biex(raw, COFACTOR),
	label: fmtTick(raw),
}))

export const LINEAR_SLIDER_MARKS = [0, 65000, 130000, 200000, 262144].map(
	(v) => ({
		value: v,
		label: v === 0 ? "0" : `${Math.round(v / 1000)}k`,
	}),
)
