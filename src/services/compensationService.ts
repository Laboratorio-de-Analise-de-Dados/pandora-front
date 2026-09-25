import CytometryApi from "../API"
import type { DensityResponse, Scale } from "../types"

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
	/** BE-35: id da matriz de origem quando esta é um ajuste manual. */
	derived_from: number | null
	derived_from_name: string | null
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

/** BE-35: criação manual — do zero ou ajustada (`derived_from`) de outra. */
export interface CompensationManualCreatePayload {
	name?: string
	channels: string[]
	matrix: number[][]
	derived_from?: number
	apply?: boolean
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

/** BE-35: POST compensations/ — matriz manual (do zero ou derivada). */
export const createCompensation = async (
	experimentId: number,
	payload: CompensationManualCreatePayload,
): Promise<CompensationMatrix> => {
	const res = await CytometryApi.post(
		`/experiment/${experimentId}/compensations/`,
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

/** BE-36: parâmetros de renderização — os mesmos do density atual. */
export interface CompensationPreviewParams {
	mode: "heatmap" | "scatter" | "histogram"
	bins?: number
	cutoff?: number
	sample?: number
	xscale: Scale
	yscale: Scale
	cofactor: number
	xmin?: string
	xmax?: string
	ymin?: string
	ymax?: string
}

/** BE-36: prévia ad-hoc — matriz em edição, nunca persistida. */
export interface CompensationPreviewPayload {
	channels: string[]
	matrix: number[][]
	/** Amostra selecionada no workspace (fileDataId). */
	file: number
	x_axis: string
	y_axis: string
	params: CompensationPreviewParams
}

/**
 * FE-41 / BE-36: densidade da amostra com a matriz ad-hoc aplicada —
 * não persiste nada. Resposta = mesmo formato do density, então o plot
 * principal renderiza direto.
 */
export const previewCompensation = async (
	experimentId: number,
	payload: CompensationPreviewPayload,
): Promise<DensityResponse> => {
	const res = await CytometryApi.post<DensityResponse>(
		`/experiment/${experimentId}/compensations/preview`,
		payload,
	)
	return res.data
}
