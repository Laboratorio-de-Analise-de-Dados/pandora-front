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

export const fetchFileStats = async (
	fileDataId: number,
): Promise<AnalysisResultData> => {
	const res = await CytometryApi.get(`/experiment/file/${fileDataId}/stats`)
	return res.data
}
