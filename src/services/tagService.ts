import CytometryApi from "../API"
import type { SampleTag } from "../types"

/** Vocabulário de tags visível ao usuário (sistema + org + pessoais). */
export const fetchTags = async (): Promise<SampleTag[]> => {
	const res = await CytometryApi.get("/experiment/tags/")
	return res.data
}

/**
 * Cria uma tag de usuário (escopo pessoal ou da organização). O backend
 * deduplica por nome normalizado — retorna a existente com 200 se repetir.
 */
export const createTag = async (payload: {
	name: string
	color?: string
	organization?: number | null
}): Promise<SampleTag> => {
	const res = await CytometryApi.post("/experiment/tags/", payload)
	return res.data
}

/**
 * Substitui o conjunto completo de tags explícitas da amostra (BE-34).
 * Máximo uma tag de categoria "control" — o backend valida com 400.
 * Tags herdadas do subsample são virtuais e não entram aqui.
 */
export const updateFileTags = async (
	fileDataId: number,
	tagIds: number[],
): Promise<{ tags: SampleTag[] }> => {
	const res = await CytometryApi.put(`/experiment/file/${fileDataId}/tags`, {
		tags: tagIds,
	})
	return res.data
}
