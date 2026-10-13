import type { ChannelMeta, Scale } from "../../../types"
import { toDisplay } from "./biex"
import { LINEAR_SLIDER_MAX } from "./sliders"

/** Range nativo ($PnR) de um canal no header FCS da amostra, se exposto. */
export const channelRangeFor = (
	meta: ChannelMeta[] | undefined,
	channel: string,
): number | undefined => meta?.find((m) => m.name === channel)?.range

/**
 * Calcula o range de um eixo a partir dos limites informados (string vazia =
 * sem limite → range padrão), aplicando o transform da escala (biex/log)
 * quando o eixo não é linear.
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
	const defaultMax = channelRange ?? LINEAR_SLIDER_MAX
	if (min === "" || max === "")
		return [toDisplay(0, scale, cof), toDisplay(defaultMax, scale, cof)]
	return [
		toDisplay(parseFloat(min), scale, cof),
		toDisplay(parseFloat(max), scale, cof),
	]
}
