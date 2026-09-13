import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import {
	fetchExperiment,
	fetchExperimentFiles,
	fetchFileStats,
} from "../../../services/experimentService"
import { fetchSubsamples } from "../../../services/subsampleService"
import type {
	Experiment,
	ExperimentFiles,
	AnalysisResultData,
	Subsample,
} from "../../../types"

export function useExperimentQuery(id: string) {
	return useQuery<Experiment>({
		queryKey: ["experiment", id],
		queryFn: async () => fetchExperiment(id),
		enabled: !!id,
	})
}

export function useExperimentFilesQuery(id: string, includeInactive = false) {
	return useQuery<ExperimentFiles[]>({
		queryKey: ["experiment-files", id, includeInactive],
		queryFn: async () => fetchExperimentFiles(id, includeInactive),
		enabled: !!id,
	})
}

export function useSubsamplesQuery(id: string, includeInactive = false) {
	return useQuery<Subsample[]>({
		queryKey: ["experiment-subsamples", id, includeInactive],
		queryFn: async () => fetchSubsamples(id, includeInactive),
		enabled: !!id,
	})
}

export function useFileStatsQuery(
	sourceType: string | undefined,
	sourceId: number | undefined,
) {
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
		queryClient.invalidateQueries({ queryKey: ["experiment-subsamples", id] })
	}, [queryClient, id])
}
