import type { ExperimentFiles } from "../../../types"
import type { SubsampleGroup } from "./groupBySubsample"

/**
 * Filtro de amostras da árvore do workspace (FE-38). Casa `file_name`,
 * nomes de tags (explícitas + herdadas) e nome do subsample — sem acento
 * e sem case, para "fmo" achar "FMO" e "controle" achar "Controle".
 * Funções puras (ADR-0008).
 */

/** Minúsculas + sem diacríticos — comparação tolerante a acento. */
export function normalizeQuery(text: string): string {
	return text
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.trim()
}

/** A amostra casa a busca por nome de arquivo ou nome de tag. */
export function fileMatchesQuery(
	file: ExperimentFiles,
	query: string,
): boolean {
	const q = normalizeQuery(query)
	if (!q) return true
	if (normalizeQuery(file.file_name).includes(q)) return true
	return [...(file.tags ?? []), ...(file.inherited_tags ?? [])].some((tag) =>
		normalizeQuery(tag.name).includes(q),
	)
}

/** Lista plana (sem nível subsample) filtrada pela busca. */
export function filterFilesByQuery(
	files: ExperimentFiles[],
	query: string,
): ExperimentFiles[] {
	if (!normalizeQuery(query)) return files
	return files.filter((f) => fileMatchesQuery(f, query))
}

/**
 * Grupos filtrados pela busca. Subsample cujo nome casa mantém o grupo
 * inteiro; senão só as amostras que casam. Grupo que sobra vazio some —
 * subsample sem arquivo já aparece vazio sem busca, na busca é ruído.
 */
export function filterGroupsByQuery(
	groups: SubsampleGroup[],
	query: string,
): SubsampleGroup[] {
	const q = normalizeQuery(query)
	if (!q) return groups
	return groups.flatMap((group) => {
		if (group.subsample && normalizeQuery(group.subsample.name).includes(q))
			return [group]
		const files = group.files.filter((f) => fileMatchesQuery(f, query))
		return files.length > 0 ? [{ ...group, files }] : []
	})
}
