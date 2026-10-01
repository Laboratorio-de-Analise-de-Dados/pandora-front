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
	| "rcv"

/**
 * Estratégia de teste entre grupos (BE-33 §7.5): `auto` deixa o backend
 * escolher por n/pressupostos; a escolha efetiva volta em
 * `stats_tests[].method`.
 */
export type FigureStatsTest = "auto" | "parametric" | "nonparametric"

export interface FigureGroup {
	name: string
	file_data_ids: number[]
}

/**
 * `populations` são caminhos de nomes de gate ("Pai/Filho" — separador "/",
 * com fallback " > " no back). O literal `"file"` resolve para as stats da
 * amostra raiz (ver ROOT_POPULATION em figureSeries).
 */
export interface FigureSpec {
	groups: FigureGroup[]
	populations: string[]
	metric: FigureMetric
	channel?: string
	stats_test?: FigureStatsTest
}

export interface FigureResultRow {
	group: string
	file_data_id: number
	file_name: string
	population: string
	value: number
}

/**
 * Teste entre grupos de uma população (BE-33 §7.5). Só existe em
 * stats_bar/stats_strip — distribution nunca carrega a chave.
 * `omnibus: null` + `pairwise: []` quando há <2 grupos elegíveis.
 */
export interface FigureStatsTestResult {
	population: string
	/** Escolha efetiva quando `spec.stats_test` = "auto". */
	method: "parametric" | "nonparametric"
	omnibus: {
		test: "one_way_anova" | "kruskal_wallis"
		F?: number
		H?: number
		p: number
		df: number[]
	} | null
	pairwise: {
		group_a: string
		group_b: string
		t?: number
		U?: number
		p: number
		/** p ajustado (Benjamini-Hochberg). */
		p_adj: number
		method: "welch_t" | "mann_whitney_u"
	}[]
	n_per_group: Record<string, number>
	warnings: string[]
}

export interface FigureResultCache {
	rows: FigureResultRow[]
	/** Pares (população, amostra) resolvidos — cobre distribution (sem rows). */
	resolved_pairs?: { population: string; file_data_id: number }[]
	resolved_inputs: {
		gate_ids: number[]
		file_data_ids: number[]
		channel?: string
	}
	stats_tests?: FigureStatsTestResult[]
	unmatched: {
		populations: string[]
		files: { file_data_id: number; file_name: string | null }[]
	}
	meta: {
		n_por_grupo?: Record<string, number>
		computed_at?: string
		spec_fingerprint?: string
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
	chart_type?: FigureChartType
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

/**
 * 404 tem dois significados aqui: rota inexistente num backend antigo (Django
 * devolve HTML) → cai no mock; e recurso fora de escopo/inexistente no BE-33
 * real (DRF devolve JSON com `detail`) → erro verdadeiro, nunca mock.
 */
const isRouteMissing = (error: unknown): boolean => {
	if (!axios.isAxiosError(error) || error.response?.status !== 404) {
		return false
	}
	const data = error.response.data
	return !(typeof data === "object" && data !== null && "detail" in data)
}

/**
 * Enquanto o BE-33 não existe, um 404 de rota cai no mock local (mesmo
 * contrato) — padrão adotado no FE-41. `mockDeps` é ignorado quando o
 * endpoint responde. 404 de recurso (permissão/inexistente) propaga erro.
 */
export const fetchFigures = async (
	experimentId: number,
	mockDeps?: FigureMockDeps,
): Promise<AnalysisFigureListItem[]> => {
	try {
		const res = await CytometryApi.get<{
			results: AnalysisFigureListItem[]
		}>(`/analytics/experiment/${experimentId}/figures/`)
		return res.data.results
	} catch (error) {
		if (isRouteMissing(error) && mockDeps) {
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
		if (isRouteMissing(error) && mockDeps) {
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
		if (isRouteMissing(error) && mockDeps) {
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
		if (isRouteMissing(error) && mockDeps) {
			return mockUpdateFigure(figureId, payload, mockDeps)
		}
		throw error
	}
}

export const deleteFigure = async (figureId: number): Promise<void> => {
	try {
		await CytometryApi.delete(`/analytics/figures/${figureId}/`)
	} catch (error) {
		if (isRouteMissing(error)) {
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
		if (isRouteMissing(error) && mockDeps) {
			return mockRecomputeFigure(figureId, mockDeps)
		}
		throw error
	}
}
