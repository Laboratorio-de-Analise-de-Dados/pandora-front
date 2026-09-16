import CytometryApi from "../API"

/**
 * Compensação (spillover) — BE-22 no backend, ADR-0018/0019.
 * A matriz N×N é versionada por experimento; no máximo uma `is_applied`.
 * A aplicação acontece na leitura (o dado bruto nunca é reescrito), então
 * apply/remove mudam density/stats/preview — invalidar essas queries.
 */

export type CompensationSource = "fcs_header" | "computed" | "manual"

export interface CompensationMatrix {
	id: number
	name: string
	/** Ordem dos eixos da matriz (canais fluorescentes). */
	channels: string[]
	/** S N×N — fração do fluorócromo j detectada no canal i (row-major). */
	matrix: number[][]
	source: CompensationSource
	is_applied: boolean
	created_by_name: string | null
	created_at: string
}

/** Matriz `$SPILLOVER`/`$COMP` lida direto dos headers — ainda não persistida. */
export interface EmbeddedCompensation {
	channels: string[]
	matrix: number[][]
	file_data_id: number
	source: "fcs_header"
}

export interface CompensationComputePayload {
	name?: string
	/** Override: ids de amostra do controle negativo (default: subsamples). */
	negative?: number[]
	/** Override: canal → ids de amostra do controle single-stain. */
	controls?: Record<string, number[]>
}

export const fetchCompensations = async (
	experimentId: number,
): Promise<CompensationMatrix[]> => {
	const res = await CytometryApi.get(
		`/experiment/${experimentId}/compensations/`,
	)
	return res.data.results ?? res.data
}

/** 204 → null (nenhuma amostra traz a keyword). */
export const fetchEmbeddedCompensation = async (
	experimentId: number,
): Promise<EmbeddedCompensation | null> => {
	const res = await CytometryApi.get(
		`/experiment/${experimentId}/compensations/embedded`,
	)
	return res.status === 204 ? null : res.data
}

export const fromHeaderCompensation = async (
	experimentId: number,
	payload: { name?: string; apply?: boolean } = {},
): Promise<CompensationMatrix> => {
	const res = await CytometryApi.post(
		`/experiment/${experimentId}/compensations/from-header`,
		payload,
	)
	return res.data
}

export const computeCompensation = async (
	experimentId: number,
	payload: CompensationComputePayload = {},
): Promise<CompensationMatrix> => {
	const res = await CytometryApi.post(
		`/experiment/${experimentId}/compensations/compute`,
		payload,
	)
	return res.data
}

export const applyCompensation = async (
	experimentId: number,
	matrixId: number,
): Promise<void> => {
	await CytometryApi.post(
		`/experiment/${experimentId}/compensations/${matrixId}/apply`,
	)
}

export const removeCompensation = async (
	experimentId: number,
): Promise<void> => {
	await CytometryApi.post(`/experiment/${experimentId}/compensations/remove`)
}

export const renameCompensation = async (
	matrixId: number,
	name: string,
): Promise<CompensationMatrix> => {
	const res = await CytometryApi.patch(
		`/analytics/compensations/${matrixId}/`,
		{
			name,
		},
	)
	return res.data
}

/** Soft delete — se aplicada, o backend desliga antes (com revisão). */
export const discardCompensation = async (matrixId: number): Promise<void> => {
	await CytometryApi.delete(`/analytics/compensations/${matrixId}/`)
}
