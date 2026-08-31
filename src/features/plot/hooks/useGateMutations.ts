import { useCallback } from "react"
import { toast } from "react-toastify"
import {
	deleteGate as deleteGateById,
	updateGate,
} from "../../../services/gateService"
import type { GateScope } from "../../../services/gateService"
import type { Gate, GateCoordinates } from "../../../types"

const TOAST_POS = { position: "bottom-right" as const }

const extractError = (error: unknown): string => {
	const err = error as {
		response?: { data?: { detail?: string } | unknown }
		message?: string
	}
	const data = err?.response?.data
	if (data && typeof data === "object" && "detail" in data) {
		const detail = (data as { detail?: unknown }).detail
		if (typeof detail === "string") return detail
	}
	return data ? JSON.stringify(data) : (err?.message ?? "Erro desconhecido")
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

	/**
	 * Salva nome e cor. Com `scope="experiment"` o backend replica nas cópias do
	 * gate nas outras amostras e devolve os ids propagados e os conflitos de nome.
	 * Devolve a mensagem de erro (para o diálogo exibir) ou `null` em caso de
	 * sucesso.
	 */
	const saveGateNameColor = useCallback(
		async (
			gateId: number,
			name: string,
			color: string,
			scope: GateScope = "file",
		): Promise<string | null> => {
			try {
				const result = await updateGate(gateId, { name, color, scope })
				if (scope === "experiment") {
					toast.success(
						`Gate atualizado em ${result.propagated_gate_ids.length + 1} amostra(s)`,
						TOAST_POS,
					)
					if (result.conflicts.length > 0) {
						toast.warn(
							`Nome já usado em: ${result.conflicts
								.map((conflict) => conflict.file_name)
								.join(", ")}`,
							TOAST_POS,
						)
					}
				} else {
					toast.success("Gate atualizado com sucesso!", TOAST_POS)
				}
				loadFile()
				return null
			} catch (error: unknown) {
				return extractError(error)
			}
		},
		[loadFile],
	)

	return { patchCoordinates, deleteGate, saveGateNameColor }
}
