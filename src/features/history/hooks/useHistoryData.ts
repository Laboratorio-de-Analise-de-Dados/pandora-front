import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import {
	fetchCheckpoints,
	fetchGroupedHistory,
	fetchRevisionState,
} from "../../../services/historyService"
import type { RevisionStateResponse } from "../../../services/historyService"

/**
 * Timeline em sessões (auto-checkpoints derivados no backend, ADR-0017).
 * Paginação por cursor: `next_cursor` busca a página anterior.
 */
export function useGroupedHistoryQuery(
	experimentId: number | undefined,
	fileId?: number,
	branchId?: number | null,
) {
	return useInfiniteQuery({
		queryKey: [
			"history",
			experimentId,
			fileId ?? "experiment",
			branchId ?? "main",
		],
		queryFn: async ({ pageParam }) =>
			fetchGroupedHistory(experimentId as number, pageParam, fileId, branchId),
		initialPageParam: undefined as number | undefined,
		getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
		enabled: !!experimentId,
	})
}

export function useCheckpointsQuery(experimentId: number | undefined) {
	return useQuery({
		queryKey: ["checkpoints", experimentId],
		queryFn: async () => fetchCheckpoints(experimentId as number),
		enabled: !!experimentId,
	})
}

/**
 * Preview read-only do estado da análise numa revisão (`GET .../state/`).
 * Só dispara quando um `revisionId` é passado — abrir/fechar o preview é
 * controlar esse id no chamador.
 */
export function useRevisionStateQuery(revisionId: number | null) {
	return useQuery<RevisionStateResponse>({
		queryKey: ["revision-state", revisionId],
		queryFn: async () => fetchRevisionState(revisionId as number),
		enabled: revisionId != null,
	})
}
