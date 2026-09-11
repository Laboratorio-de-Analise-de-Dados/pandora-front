import CytometryApi from "../API"
import type { Gate, GateCoordinates, NewGate, PlotViewConfig } from "../types"

export type GateScope = "file" | "experiment"

export interface GateUpdatePayload {
	name?: string
	color?: string
	gate_coordinates?: GateCoordinates
	plot_config?: Partial<PlotViewConfig>
	scope?: GateScope
}

export interface GateUpdateConflict {
	gate_id: number
	file_data_id: number
	file_name: string
	detail: string
}

export interface GateUpdateResult extends Gate {
	propagated_gate_ids: number[]
	conflicts: GateUpdateConflict[]
}

export interface ApplyGatesPayload {
	source_gate_ids: number[]
	target_file_data_ids: number[]
	recursive: boolean
	on_conflict?: "replace" | "rename" | "skip"
	dry_run?: boolean
}

export interface ApplyGateConflict {
	gate_id: number
	file_data_id: number
	file_name?: string
	name: string
}

export interface ApplyGatesResult {
	created: number
	skipped: number
	replaced: number
	conflicts: ApplyGateConflict[]
}

export interface DeleteGatesBatchPayload {
	source_gate_ids: number[]
	scope?: GateScope
	target_file_data_ids?: number[]
	recursive?: boolean
	include_source?: boolean
}

export interface DeleteGatesBatchResult {
	deleted: number
	details: { file_data_id: number; gates_deleted: number }[]
}

export const createGate = async (gate: NewGate): Promise<Gate> => {
	const res = await CytometryApi.post<Gate>("analytics/gate", gate)
	return res.data
}

export const updateGate = async (
	gateId: number,
	payload: GateUpdatePayload,
): Promise<GateUpdateResult> => {
	const res = await CytometryApi.patch<GateUpdateResult>(
		`/analytics/gate/${gateId}`,
		payload,
	)
	return res.data
}

export const deleteGate = async (gateId: number): Promise<void> => {
	await CytometryApi.delete(`/analytics/gate/${gateId}`)
}

export const deleteGatesBatch = async (
	payload: DeleteGatesBatchPayload,
): Promise<DeleteGatesBatchResult> => {
	const res = await CytometryApi.post<DeleteGatesBatchResult>(
		"/analytics/gate/delete-batch",
		payload,
	)
	return res.data
}

export const applyGates = async (
	payload: ApplyGatesPayload,
): Promise<ApplyGatesResult> => {
	const res = await CytometryApi.post<ApplyGatesResult>(
		"/analytics/gate/apply",
		payload,
	)
	return res.data
}
