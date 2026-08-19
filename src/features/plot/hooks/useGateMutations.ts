import { useCallback } from "react"
import { toast } from "react-toastify"
import { deleteGate as deleteGateById, updateGate } from "../../../services/gateService"
import type { Gate, GateCoordinates } from "../../../types"

const TOAST_POS = { position: "bottom-right" as const }

const extractError = (error: unknown): string => {
	const err = error as { response?: { data?: unknown }; message?: string }
	return err?.response?.data
		? JSON.stringify(err.response.data)
		: (err?.message ?? "Erro desconhecido")
}

/**
 * Centraliza as mutações de gate (API + toast + reload), evitando o try/catch
 * repetido pelo componente do gráfico.
 */
export function useGateMutations(loadFile: () => void) {
	const patchCoordinates = useCallback(
		async (gateId: number, coords: GateCoordinates) => {
			try {
				await updateGate(gateId, { gate_coordinates: coords })
				loadFile()
			} catch (error: unknown) {
				toast.error(`Erro ao atualizar gate: ${extractError(error)}`, TOAST_POS)
			}
		},
		[loadFile],
	)

	const deleteGate = useCallback(
		async (gate: Gate) => {
			try {
				await deleteGateById(gate.id)
				toast.success(`Gate "${gate.name}" excluído`, TOAST_POS)
				loadFile()
			} catch (error: unknown) {
				toast.error(`Erro ao excluir gate: ${extractError(error)}`, TOAST_POS)
			}
		},
		[loadFile],
	)

	const saveGateNameColor = useCallback(
		async (gateId: number, name: string, color: string): Promise<boolean> => {
			try {
				await updateGate(gateId, { name, color })
				toast.success("Gate atualizado com sucesso!", TOAST_POS)
				loadFile()
				return true
			} catch (error: unknown) {
				toast.error(`Erro ao atualizar gate: ${extractError(error)}`, TOAST_POS)
				return false
			}
		},
		[loadFile],
	)

	return { patchCoordinates, deleteGate, saveGateNameColor }
}
