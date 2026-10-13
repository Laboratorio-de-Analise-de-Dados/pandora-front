import type { ChannelMeta, Scale } from "../../../types"
import { biex } from "./biex"
import { LINEAR_SLIDER_MAX } from "./sliders"

/** Range nativo ($PnR) de um canal no header FCS da amostra, se exposto. */
export const channelRangeFor = (
	meta: ChannelMeta[] | undefined,
	channel: string,
): number | undefined => meta?.find((m) => m.name === channel)?.range

/**
 * Calcula o range de um eixo a partir dos limites informados (string vazia =
 * sem limite → range padrão), aplicando biex quando a escala for biexponencial.
 *
 * `channelRange` (unidades cruas, do $PnR do FCS) sobrescreve o teto
 * default: o eixo fica fiel ao detector que adquiriu a amostra — FSC/SSC
 * do CytoFLEX (ex.: 4.2M) não divide mais o teto com fluorescência (10⁷).
 */
export const buildAxisRange = (
	min: string,
	max: string,
	scale: Scale,
	cof: number,
	channelRange?: number,
): number[] => {
	const defaultMax =
		channelRange != null
			? channelRange
			: scale === "biex"
				? 10000000
				: LINEAR_SLIDER_MAX
	const defaultRange =
		scale === "biex" ? [biex(0, cof), biex(defaultMax, cof)] : [0, defaultMax]
	if (min === "" || max === "") return defaultRange
	return scale === "biex"
		? [biex(parseFloat(min), cof), biex(parseFloat(max), cof)]
		: [parseFloat(min), parseFloat(max)]
}
