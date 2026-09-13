import CytometryApi from "../API"
import type { AnalysisResultData, Experiment, ExperimentFiles } from "../types"

export const fetchExperiments = async (): Promise<Experiment[]> => {
	const res = await CytometryApi.get("/experiment")
	return res.data
}

export const fetchExperiment = async (id: string): Promise<Experiment> => {
	const res = await CytometryApi.get(`/experiment/${id}`)
	return res.data
}

export interface ExperimentInitPayload {
	title: string
	type: string
	totalChunks: number
	fileName?: string
	organizationId?: number | null
}

export interface ExperimentInitResponse {
	fileId: number
}

export const initExperimentUpload = async (
	payload: ExperimentInitPayload,
): Promise<ExperimentInitResponse> => {
	const res = await CytometryApi.post("/experiment/init/", payload)
	return res.data
}

export const uploadExperimentChunk = async (
	fileId: number,
	chunkIndex: number,
	chunk: Blob,
): Promise<void> => {
	const formData = new FormData()
	formData.append("fileId", String(fileId))
	formData.append("chunkIndex", String(chunkIndex))
	formData.append("chunk", chunk)
	await CytometryApi.post("/experiment/upload-chunk/", formData)
}

export const completeExperimentUpload = async (
	fileId: number,
	fileName: string,
): Promise<void> => {
	await CytometryApi.post("/experiment/complete/", { fileId, fileName })
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
	experimentId?: number,
): Promise<FileHashCheckResponse> => {
	const res = await CytometryApi.post("/experiment/check-hash/", {
		sha256,
		...(experimentId != null ? { experiment_id: experimentId } : {}),
	})
	return res.data
}

export interface FileUploadInitResponse {
	fileId: number
}

export const initExperimentFileUpload = async (
	experimentId: number,
	fileName: string,
	totalChunks: number,
): Promise<FileUploadInitResponse> => {
	const res = await CytometryApi.post(
		`/experiment/${experimentId}/files/init`,
		{ fileName, totalChunks },
	)
	return res.data
}

export const uploadExperimentFileChunk = async (
	fileId: number,
	chunkIndex: number,
	chunk: Blob,
): Promise<void> => {
	const formData = new FormData()
	formData.append("fileId", String(fileId))
	formData.append("chunkIndex", String(chunkIndex))
	formData.append("chunk", chunk)
	await CytometryApi.post("/experiment/files/upload-chunk/", formData)
}

export interface FileUploadCompleteResponse {
	status: string
	/** Quantas amostras novas entraram no experimento. */
	added: number
	/** Amostras puladas por já existirem no experimento. */
	skipped: string[]
}

export const completeExperimentFileUpload = async (
	fileId: number,
	fileName: string,
): Promise<FileUploadCompleteResponse> => {
	const res = await CytometryApi.post("/experiment/files/complete/", {
		fileId,
		fileName,
	})
	return res.data
}

/** Baixa o experimento como ZIP reconstruído pelos subsamples atuais. */
export const downloadExperiment = async (
	id: number,
	title: string,
): Promise<void> => {
	const res = await CytometryApi.get(`/experiment/${id}/download`, {
		responseType: "blob",
	})
	const url = URL.createObjectURL(res.data as Blob)
	const anchor = document.createElement("a")
	anchor.href = url
	anchor.download = `${title}.zip`
	anchor.click()
	URL.revokeObjectURL(url)
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
