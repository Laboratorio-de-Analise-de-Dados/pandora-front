import type { PlotViewConfig } from "../../../types"

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
 *    amostra raiz com a última config salva (FE-77/BE #71).
 */
export function resolvePlotInitialConfig({
	keepCurrent,
	viewConfig,
	saved,
	persistedConfig,
}: {
	keepCurrent: boolean
	viewConfig: PlotViewConfig
	saved?: PlotViewConfig
	persistedConfig?: Partial<PlotViewConfig>
}): PlotViewConfig {
	if (keepCurrent) return viewConfig
	if (saved) return saved
	return { ...viewConfig, ...persistedConfig }
}
