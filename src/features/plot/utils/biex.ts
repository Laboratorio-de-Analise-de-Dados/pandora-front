import type { ChannelMeta, Scale } from "../../../types"

export const COFACTOR = 150

/** arcsinh (biex): converte valor cru para espaço exibido. */
export const biex = (v: number, cof: number): number => Math.asinh(v / cof)

/** log10 clipado em 1 — mesmo transform do `apply_scale` do backend. */
export const logT = (v: number): number => Math.log10(Math.max(v, 1))

/** Converte valor cru para o espaço exibido na escala do eixo. */
export const toDisplay = (v: number, scale: Scale, cof: number): number =>
	scale === "biex" ? biex(v, cof) : scale === "log" ? logT(v) : v

/** Inverso do transform: converte espaço exibido para cru. */
export const toRaw = (v: number, scale: Scale, cof: number): number =>
	scale === "biex" ? Math.sinh(v) * cof : scale === "log" ? 10 ** v : v

/**
 * Escala default de um canal: com metadado do header FCS ($PnE →
 * `log_decades`) o amplificador de aquisição manda — canal log vira "log",
 * linear vira "linear". Sem metadado (amostra legada) vale a heurística:
 * FSC/SSC/Time são lineares; demais canais usam biex por padrão.
 */
export const defaultScale = (
	param: string,
	channelMeta?: ChannelMeta[],
): Scale => {
	const decades = channelMeta?.find((m) => m.name === param)?.log_decades
	if (decades != null) return decades > 0 ? "log" : "linear"
	const p = param.toLowerCase()
	return p.startsWith("fsc") || p.startsWith("ssc") || p === "time"
		? "linear"
		: "biex"
}
