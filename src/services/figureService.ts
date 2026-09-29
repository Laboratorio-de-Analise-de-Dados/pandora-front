import axios from "axios"
import CytometryApi from "../API"
import {
	mockCreateFigure,
	mockDeleteFigure,
	mockGetFigure,
	mockListFigures,
	mockRecomputeFigure,
	mockUpdateFigure,
	type FigureMockDeps,
} from "./figureMock"

/** Tipos do contrato frozen do BE-33 (PRD `figuras-de-analise`). */

export type FigureChartType = "stats_bar" | "stats_strip" | "distribution"

export type FigureMetric =
	| "percent_parent"
	| "percent_total"
	| "mean_mfi"
	| "median_mfi"
	| "std_dev"
	| "cv"

export interface FigureGroup {
	name: string
	file_data_ids: number[]
}

/**
 * `populations` são caminhos de nomes de gate ("Pai/Filho"). O caminho `"."`
 * representa a amostra inteira (raiz, sem gate).
 */
export interface FigureSpec {
	groups: FigureGroup[]
	populations: string[]
	metric: FigureMetric
	channel?: string
}

export interface FigureResultRow {
	group: string
	file_data_id: number
	file_name: string
	population: string
	value: number
}

export interface FigureResultCache {
	rows: FigureResultRow[]
	resolved_inputs: {
		gate_ids: number[]
		file_data_ids: number[]
		channel?: string
	}
	unmatched: {
		populations: string[]
		files: number[]
	}
	meta: {
		n_por_grupo?: Record<string, number>
		computed_at?: string
		warnings?: string[]
	}
}

export interface AnalysisFigureListItem {
	id: number
	name: string
	chart_type: FigureChartType
	updated_at: string
	is_stale: boolean
	published: boolean
	created_by_name: string | null
}

export interface AnalysisFigure extends AnalysisFigureListItem {
	spec: FigureSpec
	result_cache: FigureResultCache | null
	result_revision: number | null
	created_at: string
}

export interface FigureCreatePayload {
	name: string
	chart_type: FigureChartType
	spec: FigureSpec
}

export interface FigureUpdatePayload {
	name?: string
	spec?: FigureSpec
	published?: boolean
	/** Optimistic lock — o back devolve 412 se divergir do `updated_at` atual. */
	updated_at?: string
}

export interface FigureRecomputeResult {
	figure: AnalysisFigure
	removed_since_last: {
		populations: string[]
		files: { file_data_id: number; file_name: string }[]
	}
}

const isNotFound = (error: unknown): boolean =>
	axios.isAxiosError(error) && error.response?.status === 404

/**
 * Enquanto o BE-33 não existe, um 404 cai no mock local (mesmo contrato) —
 * padrão adotado no FE-41. `mockDeps` é ignorado quando o endpoint responde.
 */
export const fetchFigures = async (
	experimentId: number,
	mockDeps?: FigureMockDeps,
): Promise<AnalysisFigureListItem[]> => {
	try {
		const res = await CytometryApi.get<AnalysisFigureListItem[]>(
			`/analytics/experiment/${experimentId}/figures/`,
		)
		return res.data
	} catch (error) {
		if (isNotFound(error) && mockDeps) {
			return mockListFigures(experimentId, mockDeps)
		}
		throw error
	}
}

export const fetchFigure = async (
	figureId: number,
	mockDeps?: FigureMockDeps,
): Promise<AnalysisFigure> => {
	try {
		const res = await CytometryApi.get<AnalysisFigure>(
			`/analytics/figures/${figureId}/`,
		)
		return res.data
	} catch (error) {
		if (isNotFound(error) && mockDeps) {
			return mockGetFigure(figureId, mockDeps)
		}
		throw error
	}
}

export const createFigure = async (
	experimentId: number,
	payload: FigureCreatePayload,
	mockDeps?: FigureMockDeps,
): Promise<AnalysisFigure> => {
	try {
		const res = await CytometryApi.post<AnalysisFigure>(
			`/analytics/experiment/${experimentId}/figures/`,
			payload,
		)
		return res.data
	} catch (error) {
		if (isNotFound(error) && mockDeps) {
			return mockCreateFigure(experimentId, payload, mockDeps)
		}
		throw error
	}
}

export const updateFigure = async (
	figureId: number,
	payload: FigureUpdatePayload,
	mockDeps?: FigureMockDeps,
): Promise<AnalysisFigure> => {
	try {
		const res = await CytometryApi.patch<AnalysisFigure>(
			`/analytics/figures/${figureId}/`,
			payload,
		)
		return res.data
	} catch (error) {
		if (isNotFound(error) && mockDeps) {
			return mockUpdateFigure(figureId, payload, mockDeps)
		}
		throw error
	}
}

export const deleteFigure = async (figureId: number): Promise<void> => {
	try {
		await CytometryApi.delete(`/analytics/figures/${figureId}/`)
	} catch (error) {
		if (isNotFound(error)) {
			mockDeleteFigure(figureId)
			return
		}
		throw error
	}
}

export const recomputeFigure = async (
	figureId: number,
	mockDeps?: FigureMockDeps,
): Promise<FigureRecomputeResult> => {
	try {
		const res = await CytometryApi.post<FigureRecomputeResult>(
			`/analytics/figures/${figureId}/recompute/`,
		)
		return res.data
	} catch (error) {
		if (isNotFound(error) && mockDeps) {
			return mockRecomputeFigure(figureId, mockDeps)
		}
		throw error
	}
}
