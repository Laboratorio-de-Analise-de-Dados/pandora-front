import { useQuery } from "@tanstack/react-query"
import { findGateByPathNames } from "../../gate/utils"
import { fetchDensity } from "../../../services/densityService"
import type { ExperimentFiles } from "../../../types"
import type { AnalysisFigure } from "../../../services/figureService"
import { populationLabel, ROOT_POPULATION } from "../utils/figureSeries"

export interface DistributionSeries {
	/** Rótulo da série: "grupo · amostra" (ou "grupo · amostra · população"). */
	label: string
	x: number[]
	y: number[]
}

/**
 * Para cada (grupo, amostra, população) do spec resolve o gate por caminho
 * de nomes e busca o histograma 1D do canal — a densidade já vem com a
 * compensação aplicada à amostra (mesma regra do plot do workspace).
 * Pares sem gate/stats são omitidos (ausente, não zero).
 */
export const useDistributionData = (
	figure: AnalysisFigure | undefined,
	files: ExperimentFiles[],
) => {
	const channel = figure?.spec.channel
	const fingerprint = figure
		? JSON.stringify([
				figure.id,
				figure.spec.groups,
				figure.spec.populations,
				channel,
			])
		: ""

	return useQuery({
		queryKey: ["figure-distribution", fingerprint],
		enabled: !!figure && !!channel && files.length > 0,
		queryFn: async (): Promise<DistributionSeries[]> => {
			if (!figure || !channel) return []
			const jobs: {
				label: string
				sourceType: "file" | "gate"
				sourceId: number
			}[] = []

			for (const group of figure.spec.groups) {
				for (const fileId of group.file_data_ids) {
					const file = files.find((f) => f.id === fileId && f.active !== false)
					if (!file) continue
					for (const pop of figure.spec.populations) {
						const suffix =
							figure.spec.populations.length > 1
								? ` · ${populationLabel(pop)}`
								: ""
						if (pop === ROOT_POPULATION) {
							jobs.push({
								label: `${group.name} · ${file.file_name}${suffix}`,
								sourceType: "file",
								sourceId: file.id,
							})
							continue
						}
						const gate = findGateByPathNames(file.gates, pop.split("/"))
						if (!gate) continue
						jobs.push({
							label: `${group.name} · ${file.file_name}${suffix}`,
							sourceType: "gate",
							sourceId: gate.id,
						})
					}
				}
			}

			const responses = await Promise.all(
				jobs.map((j) =>
					fetchDensity({
						sourceType: j.sourceType,
						sourceId: j.sourceId,
						xAxis: channel,
						yAxis: channel,
						plotMode: "histogram",
						xScale: "biex",
						yScale: "linear",
						cutoff: 0,
						xMin: "",
						xMax: "",
						yMin: "",
						yMax: "",
					}),
				),
			)

			return jobs.flatMap((j, i) => {
				const d = responses[i]
				if (!d.counts?.length || !d.edges?.length) return []
				const x = d.edges.slice(0, -1).map((e, k) => (e + d.edges![k + 1]) / 2)
				const total = d.counts.reduce((acc, c) => acc + c, 0)
				return [
					{
						label: j.label,
						x,
						y: d.counts.map((c) => (total ? c / total : 0)),
					},
				]
			})
		},
	})
}
