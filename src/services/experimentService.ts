import CytometryApi from "../API"
import type {
	AnalysisResultData,
	Experiment,
	ExperimentFiles,
} from "../types"

export const fetchExperiment = async (id: string): Promise<Experiment> => {
	const res = await CytometryApi.get(`/experiment/${id}`)
	return res.data
}

export const fetchExperimentFiles = async (
	id: string,
): Promise<ExperimentFiles[]> => {
	const res = await CytometryApi.get(`/experiment/list/data/${id}`)
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
