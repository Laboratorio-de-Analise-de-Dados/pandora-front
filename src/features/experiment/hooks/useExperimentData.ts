import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import {
	fetchExperiment,
	fetchExperimentFiles,
	fetchFileStats,
} from "../../../services/experimentService"
import type { Experiment, ExperimentFiles, AnalysisResultData } from "../../../types"

export function useExperimentQuery(id: string) {
	return useQuery<Experiment>({
		queryKey: ["experiment", id],
		queryFn: async () => fetchExperiment(id),
		enabled: !!id,
	})
}

export function useExperimentFilesQuery(id: string) {
	return useQuery<ExperimentFiles[]>({
		queryKey: ["experiment-files", id],
		queryFn: async () => fetchExperimentFiles(id),
		enabled: !!id,
	})
}

export function useFileStatsQuery(sourceType: string | undefined, sourceId: number | undefined) {
	return useQuery<AnalysisResultData>({
		queryKey: ["file-stats", sourceId],
		queryFn: async () => fetchFileStats(sourceId as number),
		enabled: sourceType === "file" && !!sourceId,
	})
}

export function useInvalidateExperiment(id: string) {
	const queryClient = useQueryClient()
	return useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["experiment", id] })
		queryClient.invalidateQueries({ queryKey: ["experiment-files", id] })
	}, [queryClient, id])
}
