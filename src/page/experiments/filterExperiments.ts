import type { Experiment } from "../../types"

/**
 * Filtro da listagem: por organização via `?orgId=` (0 = experimentos
 * pessoais, sem org; null = todos) e por termo de busca no título.
 */
export const filterExperiments = (
	experiments: Experiment[],
	orgId: number | null,
	search: string,
): Experiment[] => {
	let list = experiments
	if (orgId === 0) list = list.filter((e) => !e.organization)
	else if (orgId !== null)
		list = list.filter((e) => e.organization?.id === orgId)
	const term = search.trim().toLowerCase()
	if (term) list = list.filter((e) => e.title.toLowerCase().includes(term))
	return list
}
