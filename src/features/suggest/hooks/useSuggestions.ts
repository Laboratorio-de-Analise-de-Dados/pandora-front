import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
	acceptSuggestion,
	discardSuggestion,
	fetchSuggestions,
	requestSuggestions,
} from "../../../services/suggestionService"
import type {
	AcceptSuggestionPayload,
	SuggestRequestPayload,
} from "../../../types"

/**
 * FE-42 — candidatas vivem no servidor desde que o job conclui (pendentes
 * persistidas, BE-40): o front consulta em vez de segurar estado volátil.
 * Enquanto houver run pending/processing, polling a cada 3s — o BE-27
 * explicitamente adia WebSocket/SSE.
 */
const POLL_MS = 3000

export const suggestionsKey = (experimentId?: number, fileId?: number) => [
	"suggestions",
	experimentId,
	fileId,
]

export function useSuggestionsQuery(
	experimentId: number | undefined,
	fileDataId: number | undefined,
) {
	return useQuery({
		queryKey: suggestionsKey(experimentId, fileDataId),
		queryFn: () => fetchSuggestions(experimentId!, fileDataId!),
		enabled: experimentId != null && fileDataId != null,
		refetchInterval: (query) => {
			const runs = query.state.data ?? []
			return runs.some(
				(r) => r.status === "pending" || r.status === "processing",
			)
				? POLL_MS
				: false
		},
	})
}

export function useRequestSuggestions(experimentId: number | undefined) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (payload: SuggestRequestPayload) =>
			requestSuggestions(experimentId!, payload),
		onSuccess: (run) => {
			qc.invalidateQueries({
				queryKey: suggestionsKey(experimentId, run.file_data),
			})
		},
	})
}

export function useAcceptSuggestion(
	experimentId: number | undefined,
	fileDataId: number | undefined,
	onAccepted?: () => void,
) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({
			suggestionId,
			payload,
		}: {
			suggestionId: number
			payload?: AcceptSuggestionPayload
		}) => acceptSuggestion(suggestionId, payload),
		onSuccess: () => {
			// O gate materializado aparece na árvore/plot via invalidate do
			// experimento — quem chama conecta isso ao invalidateExperiment.
			qc.invalidateQueries({
				queryKey: suggestionsKey(experimentId, fileDataId),
			})
			onAccepted?.()
		},
	})
}

export function useDiscardSuggestion(
	experimentId: number | undefined,
	fileDataId: number | undefined,
) {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (suggestionId: number) => discardSuggestion(suggestionId),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: suggestionsKey(experimentId, fileDataId),
			})
		},
	})
}
