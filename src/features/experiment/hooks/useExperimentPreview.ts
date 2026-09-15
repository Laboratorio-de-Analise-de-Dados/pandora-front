import { useQuery } from "@tanstack/react-query"
import { fetchExperimentPreview } from "../../../services/experimentService"

/**
 * Preview (thumbnail de densidade) do experimento para o card da listagem
 * (BE-21). Só busca quando a listagem diz que há preview disponível — evita
 * um request 404/204 por card.
 */
export function useExperimentPreview(experimentId: number, enabled: boolean) {
	return useQuery({
		queryKey: ["experiment-preview", experimentId],
		queryFn: () => fetchExperimentPreview(experimentId),
		enabled,
		staleTime: 5 * 60 * 1000,
	})
}
