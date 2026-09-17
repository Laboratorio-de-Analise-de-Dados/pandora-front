import type { PlotViewConfig } from "../../../types"

/**
 * Resolve a config inicial do plot ao trocar de fonte, em ordem de
 * precedência (estilo FlowJo):
 *
 * 1) navegação por setas (`keepCurrent`) → carry-forward puro: a config
 *    corrente segue para o próximo arquivo/gate;
 * 2) fonte já visitada na sessão → a última config que o usuário deixou
 *    nela (`saved`), em vez do `plot_config` salvo do gate — que estaria
 *    desatualizado em relação ao que a sessão lembra;
 * 3) 1ª visita → carry-forward com o `plot_config` do gate por cima quando
 *    houver (o gate nasce com a config de quem o desenhou).
 */
export function resolvePlotInitialConfig({
	keepCurrent,
	viewConfig,
	saved,
	gateConfig,
}: {
	keepCurrent: boolean
	viewConfig: PlotViewConfig
	saved?: PlotViewConfig
	gateConfig?: Partial<PlotViewConfig>
}): PlotViewConfig {
	if (keepCurrent) return viewConfig
	if (saved) return saved
	return { ...viewConfig, ...gateConfig }
}
