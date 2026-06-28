import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import CytometryApi from "../../../API"
import type { Experiment, ExperimentFiles } from "../../../types"

export function useExperimentQuery(id: string) {
	return useQuery<Experiment>({
		queryKey: ["experiment", id],
		queryFn: async () => {
			const res = await CytometryApi.get(`/experiment/${id}`)
			return res.data
		},
		enabled: !!id,
	})
}

export function useExperimentFilesQuery(id: string) {
	return useQuery<ExperimentFiles[]>({
		queryKey: ["experiment-files", id],
		queryFn: async () => {
			const res = await CytometryApi.get(`/experiment/list/data/${id}`)
			return res.data
		},
		enabled: !!id,
	})
}

export function useFileStatsQuery(sourceType: string | undefined, sourceId: number | undefined) {
	return useQuery({
		queryKey: ["file-stats", sourceId],
		queryFn: async () => {
			const res = await CytometryApi.get(`/experiment/file/${sourceId}/stats`)
			return res.data
		},
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
