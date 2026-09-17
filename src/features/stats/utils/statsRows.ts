import type { AnalysisResultData } from "../../../types"

export type MetricKey = "mean_mfi" | "median_mfi" | "std_dev" | "cv"

export interface ExportMetricDef {
	key: MetricKey
	shortLabel: string
}

/**
 * Descreve uma população (arquivo ou gate) pronta para virar uma linha de
 * exportação. É a unidade compartilhada entre o export detalhado e o export
 * de comparação.
 */
export interface PopulationRow {
	fileName: string
	strategy: string
	name: string
	analysis?: AnalysisResultData
}

/**
 * Engine única de montagem de linhas de exportação. Recebe as populações, os
 * canais visíveis e as métricas ativas e devolve a matriz `string[][]`
 * (cabeçalho + linhas) consumida por `exportRows`.
 */
export const buildAnalysisRows = (
	populations: PopulationRow[],
	displayChannels: string[],
	metricCols: ExportMetricDef[],
	channelLabel: (ch: string) => string,
): string[][] => {
	const header = [
		"Arquivo",
		"Gate Strategy",
		"População",
		"Count",
		"%Parent (%P)",
		"%Total (%T)",
	]
	for (const ch of displayChannels)
		for (const m of metricCols)
			header.push(`${channelLabel(ch)}_${m.shortLabel}`)

	const rows: string[][] = [header]

	for (const p of populations) {
		const sm = p.analysis?.summary_metrics
		const cs = p.analysis?.channel_statistics
		// BE-18: gate não-avaliável na amostra não exporta stat — "—" em tudo.
		const notEvaluable = p.analysis?.applicable === false
		const row: string[] = [
			p.fileName,
			p.strategy,
			p.name,
			notEvaluable ? "—" : String(sm?.count ?? ""),
			notEvaluable
				? "—"
				: sm
					? (sm.percent_of_parent_population * 100).toFixed(2)
					: "",
			notEvaluable
				? "—"
				: sm
					? (sm.percent_of_total_population * 100).toFixed(2)
					: "",
		]
		for (const ch of displayChannels) {
			const stat = cs?.[ch]
			for (const m of metricCols)
				row.push(notEvaluable ? "—" : stat ? String(stat[m.key]) : "")
		}
		rows.push(row)
	}

	return rows
}
