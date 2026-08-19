import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import type { AnalysisResultData, ExperimentFiles, Gate } from "../../../types"
import { findGateInTree } from "../../gate/utils"
import { fetchFileStats } from "../../../services/experimentService"
import type { SelectableItem } from "../components/SourceSelector"

export interface CompareRow {
	item: SelectableItem
	gate: Gate | undefined
	analysis: AnalysisResultData | undefined
}

export const useComparisonStats = (
	compareItems: SelectableItem[],
	files: ExperimentFiles[],
) => {
	const fileItemIds = useMemo(
		() => compareItems.filter((i) => i.type === "file").map((i) => i.id),
		[compareItems],
	)

	const fileStatsQueries = useQueries({
		queries: fileItemIds.map((id) => ({
			queryKey: ["fileStats", id],
			queryFn: () => fetchFileStats(id),
			enabled: Boolean(id),
		})),
	})

	const fileAnalysisMap = useMemo(() => {
		const map: Record<number, AnalysisResultData | undefined> = {}
		for (let i = 0; i < fileItemIds.length; i++) {
			map[fileItemIds[i]] = fileStatsQueries[i]?.data
		}
		return map
	}, [fileItemIds, fileStatsQueries])

	const compareData = useMemo<CompareRow[]>(() => {
		if (compareItems.length === 0) return []
		return compareItems.map((item) => {
			if (item.type === "gate") {
				for (const f of files) {
					const g = findGateInTree(f.gates, item.id)
					if (g) {
						return {
							item,
							gate: g,
							analysis: g.analysis_result?.analysis_result,
						}
					}
				}
			}
			return { item, gate: undefined, analysis: fileAnalysisMap[item.id] }
		})
	}, [compareItems, files, fileAnalysisMap])

	return { compareData }
}
