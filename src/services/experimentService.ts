import CytometryApi from "../API"
import type { AnalysisResultData, Experiment, ExperimentFiles } from "../types"

export const fetchExperiment = async (id: string): Promise<Experiment> => {
	const res = await CytometryApi.get(`/experiment/${id}`)
	return res.data
}

export const fetchExperimentFiles = async (
	id: string,
	includeInactive = false,
): Promise<ExperimentFiles[]> => {
	const res = await CytometryApi.get(`/experiment/list/data/${id}`, {
		params: includeInactive ? { include_inactive: "true" } : undefined,
	})
	return res.data
}

export const disableFileData = async (fileDataId: number): Promise<void> => {
	await CytometryApi.post(`/experiment/file/${fileDataId}/disable`)
}

export const enableFileData = async (fileDataId: number): Promise<void> => {
	await CytometryApi.post(`/experiment/file/${fileDataId}/enable`)
}

export interface UpdateExperimentPayload {
	title?: string
	type?: string
	values?: string[]
}

export const updateExperiment = async (
	id: number,
	payload: UpdateExperimentPayload,
): Promise<Experiment> => {
	const res = await CytometryApi.patch(`/experiment/${id}/`, payload)
	return res.data
}

export const deleteExperiment = async (id: number): Promise<void> => {
	await CytometryApi.delete(`/experiment/${id}`)
}

export interface CopyExperimentPayload {
	title?: string
	/** `null` = espaço pessoal do usuário. */
	organization_id: number | null
}

export const copyExperiment = async (
	id: number,
	payload: CopyExperimentPayload,
): Promise<Experiment> => {
	const res = await CytometryApi.post(`/experiment/${id}/copy`, payload)
	return res.data
}

export const moveExperiment = async (
	id: number,
	organizationId: number | null,
): Promise<Experiment> => {
	const res = await CytometryApi.patch(`/experiment/${id}/`, {
		organization_id: organizationId,
	})
	return res.data
}

export interface FileHashCheckResponse {
	exists: boolean
	file_name: string | null
}

export const checkFileHash = async (
	sha256: string,
): Promise<FileHashCheckResponse> => {
	const res = await CytometryApi.post("/experiment/check-hash/", { sha256 })
	return res.data
}

export const fetchFileStats = async (
	fileDataId: number,
): Promise<AnalysisResultData> => {
	const res = await CytometryApi.get(`/experiment/file/${fileDataId}/stats`)
	return res.data
}

export interface FileHeadersResponse {
	file_data_id: number
	file_name: string
	/** Keywords do header FCS normalizadas (`$date`, `$cyt`, `$btim`, `tot`...). */
	headers: Record<string, unknown>
}

export const fetchFileHeaders = async (
	fileDataId: number,
): Promise<FileHeadersResponse> => {
	const res = await CytometryApi.get(`/experiment/file/${fileDataId}/headers`)
	return res.data
}
