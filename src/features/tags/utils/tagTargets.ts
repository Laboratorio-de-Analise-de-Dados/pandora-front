import type { ExperimentFiles } from "../../../types"

export interface TagTarget {
	fileDataId: number
	tagIds: number[]
}

/**
 * Interseção das tags explícitas das amostras — estado inicial do picker
 * em lote: só o que TODAS têm aparece ligado.
 */
export const commonTagIds = (files: ExperimentFiles[]): Set<number> => {
	const sets = files.map((f) => new Set((f.tags ?? []).map((t) => t.id)))
	if (sets.length === 0) return new Set()
	return new Set([...sets[0]].filter((id) => sets.every((s) => s.has(id))))
}

/**
 * Semântica de delta para atribuição em lote: o que o usuário marcou a
 * mais em relação à interseção é ADICIONADO em cada amostra; o que
 * desmarcou é REMOVIDO; tags que só algumas amostras têm são mantidas
 * (PUT por amostra substitui o conjunto inteiro — por isso recomputamos
 * por amostra em vez de mandar o mesmo conjunto pra todas).
 */
export const computeTagTargets = (
	files: ExperimentFiles[],
	selected: Set<number>,
): TagTarget[] => {
	const common = commonTagIds(files)
	const added = [...selected].filter((id) => !common.has(id))
	const removed = [...common].filter((id) => !selected.has(id))
	return files.map((f) => {
		const own = new Set((f.tags ?? []).map((t) => t.id))
		removed.forEach((id) => own.delete(id))
		added.forEach((id) => own.add(id))
		return { fileDataId: f.id, tagIds: [...own] }
	})
}
