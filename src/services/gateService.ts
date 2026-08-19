import CytometryApi from "../API"
import type { Gate, GateCoordinates, NewGate, PlotViewConfig } from "../types"

export interface GateUpdatePayload {
	name?: string
	color?: string
	gate_coordinates?: GateCoordinates
	plot_config?: Partial<PlotViewConfig>
}

export interface ApplyGatesPayload {
	source_gate_ids: number[]
	target_file_data_ids: number[]
	recursive: boolean
	on_conflict?: "replace" | string
}

export const createGate = async (gate: NewGate): Promise<Gate> => {
	const res = await CytometryApi.post<Gate>("analytics/gate", gate)
	return res.data
}

export const updateGate = async (
	gateId: number,
	payload: GateUpdatePayload,
): Promise<void> => {
	await CytometryApi.patch(`/analytics/gate/${gateId}`, payload)
}

export const deleteGate = async (gateId: number): Promise<void> => {
	await CytometryApi.delete(`/analytics/gate/${gateId}`)
}

export const applyGates = async (payload: ApplyGatesPayload): Promise<void> => {
	await CytometryApi.post("/analytics/gate/apply", payload)
}
