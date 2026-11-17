import type { PlotViewConfig, Scale } from "../../../types"

/** Ajuste de eixo lembrado por canal na sessão (FE-48): escala + range
 * que o usuário deixou da última vez que mexeu naquele canal. */
export interface ChannelAxisConfig {
	scale: Scale
	min: string
	max: string
}

/** Canal → último ajuste de eixo da sessão (ex.: `"FL1-A"`). */
export type ChannelMemory = Record<string, ChannelAxisConfig>

/** Aplica a memória por canal sobre os eixos da config resolvida — só
 * escala/min/max; eixos, cutoff e plotMode seguem a fonte. */
const applyChannelMemory = (
	config: PlotViewConfig,
	channelMemory: ChannelMemory | undefined,
): PlotViewConfig => {
	if (!channelMemory) return config
	const x = channelMemory[config.xAxis]
	const y = channelMemory[config.yAxis]
	if (!x && !y) return config
	return {
		...config,
		...(x ? { xScale: x.scale, xMin: x.min, xMax: x.max } : null),
		...(y ? { yScale: y.scale, yMin: y.min, yMax: y.max } : null),
	}
}

/**
 * Resolve a config inicial do plot ao trocar de fonte, em ordem de
 * precedência (estilo FlowJo):
 *
 * 1) navegação por setas (`keepCurrent`) → carry-forward puro: a config
 *    corrente segue para o próximo arquivo/gate;
 * 2) fonte já visitada na sessão → a última config que o usuário deixou
 *    nela (`saved`), em vez do `plot_config` persistido — que estaria
 *    desatualizado em relação ao que a sessão lembra;
 * 3) 1ª visita → carry-forward com o `plot_config` persistido da fonte
 *    por cima quando houver — gate nasce com a config de quem desenhou,
 *    amostra raiz com a última config salva (FE-77/BE #71);
 * 4) memória por canal (FE-48) → escala/range dos eixos seguem o último
 *    ajuste feito para o canal na sessão, por cima do persistido.
 */
export function resolvePlotInitialConfig({
	keepCurrent,
	viewConfig,
	saved,
	persistedConfig,
	channelMemory,
}: {
	keepCurrent: boolean
	viewConfig: PlotViewConfig
	saved?: PlotViewConfig
	persistedConfig?: Partial<PlotViewConfig>
	channelMemory?: ChannelMemory
}): PlotViewConfig {
	if (keepCurrent) return viewConfig
	if (saved) return saved
	return applyChannelMemory(
		{ ...viewConfig, ...persistedConfig },
		channelMemory,
	)
}
