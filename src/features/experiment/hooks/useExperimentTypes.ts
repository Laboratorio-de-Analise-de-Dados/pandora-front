import { useQuery } from "@tanstack/react-query"
import { fetchExperimentTypes } from "../../../services/experimentService"

/** Chave compartilhada — criar/editar experimento invalida para o tipo
 * recém-criado aparecer no autocomplete sem reload. */
export const EXPERIMENT_TYPES_QUERY_KEY = ["experiment-types"]

/**
 * Vocabulário de tipos de experimento (BE-28). Alimenta o autocomplete
 * freeSolo do campo "tipo" nos dialogs de criar/editar experimento.
 */
export function useExperimentTypes() {
	return useQuery({
		queryKey: EXPERIMENT_TYPES_QUERY_KEY,
		queryFn: fetchExperimentTypes,
	})
}
