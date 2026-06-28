import type { Scale } from "../../../types"

export const COFACTOR = 150

/** arcsinh (biex): converte valor cru para espaço exibido. */
export const biex = (v: number, cof: number): number => Math.asinh(v / cof)

/** Inverso do biex: converte espaço exibido para cru. */
export const toRaw = (v: number, scale: Scale, cof: number): number =>
	scale === "biex" ? Math.sinh(v) * cof : v

/** FSC/SSC/Time são lineares; demais canais usam biex por padrão. */
export const defaultScale = (param: string): Scale => {
	const p = param.toLowerCase()
	return p.startsWith("fsc") || p.startsWith("ssc") || p === "time"
		? "linear"
		: "biex"
}
