import CytometryApi from "../API"
import type { GateCoordinates, PlotViewConfig } from "../types"

/**
 * Histórico append-only + checkpoints (BE-08/BE-20 no backend, ADR-0017).
 * Revisão = cada mutação gravada pelo autosave; sessão = agrupamento
 * temporal derivado na leitura; checkpoint = marco nomeado persistido.
 */

export interface AnalysisRevision {
	id: number
	action: string
	scope: string | null
	target: { type: string; id: number }
	/** Amostra que a revisão toca; null = ação experiment-wide. */
	file_data: number | null
	/** Frase pronta ("renomeou P1 → CD4+ em 3 amostras"). */
	summary: string
	author: string | null
	affected_ids: number[]
	created_at: string
	reverts: number | null
	revertible: boolean
}

export interface AnalysisRevisionDetail extends AnalysisRevision {
	payload_before: Record<string, unknown>
	payload_after: Record<string, unknown>
	revert_preview?: RevertPlan
}

export interface AnalysisCheckpoint {
	id: number
	/** Revisão que o checkpoint marca; null = estado inicial do experimento. */
	revision: number | null
	message: string
	created_by_name: string | null
	created_at: string
}

/** Sessão temporal derivada na leitura (?grouped=1) — nada é gravado. */
export interface HistorySession {
	start_revision_id: number
	end_revision_id: number
	started_at: string
	ended_at: string
	count: number
	/** Checkpoint fixado exatamente na borda (última revisão) da sessão. */
	checkpoint: AnalysisCheckpoint | null
	revisions: AnalysisRevision[]
}

export interface GroupedHistoryResponse {
	sessions: HistorySession[]
	next_cursor: number | null
}

export interface HistoryConflict {
	detail?: string
	revision_id?: number
	[key: string]: unknown
}

/** Entrada do plano composto de restore (uma por revisão a desfazer). */
export interface RestorePlanEntry {
	revision_id: number
	changes: Record<string, unknown>[]
	kind?: string
	conflicts?: HistoryConflict[]
}

export interface RevertPlan {
	would_change: Record<string, unknown>[]
	conflicts: HistoryConflict[]
}

export interface RestorePlan {
	would_change: RestorePlanEntry[]
	conflicts: HistoryConflict[]
}

export interface RestoreAppliedResponse {
	applied: { revision_id: number; applied: unknown }[]
	skipped: HistoryConflict[]
}

/** Snapshot de gate como era na revisão (state preview, BE-20). */
export interface GateStateSnapshot {
	id: number
	name: string
	color: string | null
	parent_id: number | null
	copied_from_id: number | null
	file_data_id: number
	dashboard_id: number | null
	gate_coordinates: GateCoordinates
	plot_config: Partial<PlotViewConfig> | null
}

export interface RevisionStateResponse {
	revision_id: number | null
	files: Record<string, GateStateSnapshot[]>
}

export const fetchGroupedHistory = async (
	experimentId: number,
	cursor?: number,
	fileId?: number,
): Promise<GroupedHistoryResponse> => {
	const res = await CytometryApi.get(
		`/analytics/experiment/${experimentId}/history/`,
		{
			params: {
				grouped: 1,
				...(cursor ? { cursor } : {}),
				...(fileId ? { file: fileId } : {}),
			},
		},
	)
	return res.data
}

export const fetchRevisionDetail = async (
	revisionId: number,
): Promise<AnalysisRevisionDetail> => {
	const res = await CytometryApi.get(`/analytics/history/${revisionId}/`)
	return res.data
}

export const fetchRevisionState = async (
	revisionId: number,
): Promise<RevisionStateResponse> => {
	const res = await CytometryApi.get(`/analytics/history/${revisionId}/state/`)
	return res.data
}

export const revertRevision = async (
	revisionId: number,
	dryRun: boolean,
): Promise<RevertPlan> => {
	const res = await CytometryApi.post(
		`/analytics/history/${revisionId}/revert/`,
		{ dry_run: dryRun },
	)
	return res.data
}

export const fetchCheckpoints = async (
	experimentId: number,
): Promise<AnalysisCheckpoint[]> => {
	const res = await CytometryApi.get(
		`/analytics/experiment/${experimentId}/checkpoints/`,
	)
	return res.data.results
}

export const createCheckpoint = async (
	experimentId: number,
	payload: { message?: string; revision_id?: number | null },
): Promise<AnalysisCheckpoint> => {
	const res = await CytometryApi.post(
		`/analytics/experiment/${experimentId}/checkpoints/`,
		payload,
	)
	return res.data
}

export const renameCheckpoint = async (
	checkpointId: number,
	message: string,
): Promise<AnalysisCheckpoint> => {
	const res = await CytometryApi.patch(
		`/analytics/checkpoints/${checkpointId}/`,
		{ message },
	)
	return res.data
}

export const discardCheckpoint = async (
	checkpointId: number,
): Promise<void> => {
	await CytometryApi.delete(`/analytics/checkpoints/${checkpointId}/`)
}

export interface RestoreRequest {
	dry_run?: boolean
	force?: boolean
}

/** Restaura até uma revisão (borda de sessão ou revisão avulsa). */
export const restoreToRevision = async (
	experimentId: number,
	revisionId: number,
	payload: RestoreRequest,
): Promise<RestorePlan | RestoreAppliedResponse> => {
	const res = await CytometryApi.post(
		`/analytics/experiment/${experimentId}/history/${revisionId}/restore/`,
		payload,
	)
	return res.data
}

/** Restaura até o ponto marcado por um checkpoint — mesmo motor. */
export const restoreToCheckpoint = async (
	checkpointId: number,
	payload: RestoreRequest,
): Promise<RestorePlan | RestoreAppliedResponse> => {
	const res = await CytometryApi.post(
		`/analytics/checkpoints/${checkpointId}/restore/`,
		payload,
	)
	return res.data
}
