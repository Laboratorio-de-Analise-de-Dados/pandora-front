import { useCallback } from "react"
import { toast } from "react-toastify"
import {
	deleteGate as deleteGateById,
	deleteGatesBatch,
	updateGate,
} from "../../../services/gateService"
import type { GateScope } from "../../../services/gateService"
import type { Gate, GateCoordinates } from "../../../types"
import { extractErrorMessage } from "../../../utils/apiError"

/**
 * Centraliza as mutações de gate (API + toast + reload), evitando o try/catch
 * repetido pelo componente do gráfico.
 */
export function useGateMutations(loadFile: () => void) {
	/**
	 * Salva a geometria. Com `scope="file"` o backend desanexa o gate da família
	 * de cópias (ele passa a ser exclusivo da amostra); com `scope="experiment"`
	 * a nova geometria vale para a família inteira.
	 */
	const patchCoordinates = useCallback(
		async (
			gateId: number,
			coords: GateCoordinates,
			scope: GateScope = "file",
		) => {
			try {
				const result = await updateGate(gateId, {
					gate_coordinates: coords,
					scope,
				})
				if (scope !== "file") {
					toast.success(
						`Geometria aplicada em ${result.propagated_gate_ids.length + 1} amostra(s)`,
					)
				}
				loadFile()
			} catch (error: unknown) {
				toast.error(`Erro ao atualizar gate: ${extractErrorMessage(error)}`)
			}
		},
		[loadFile],
	)

	const deleteGate = useCallback(
		async (gate: Gate) => {
			try {
				await deleteGateById(gate.id)
				toast.success(`Gate "${gate.name}" excluído`)
				loadFile()
			} catch (error: unknown) {
				toast.error(`Erro ao excluir gate: ${extractErrorMessage(error)}`)
			}
		},
		[loadFile],
	)

	/**
	 * Exclusão em lote no escopo da amostra (família de quadrantes, por ex.).
	 * `recursive` leva os sub-gates junto — o backend recusa sem ele e a
	 * CASCADE de parent apagaria a subárvore sem aviso.
	 */
	const deleteGates = useCallback(
		async (gates: Gate[]) => {
			if (gates.length === 0) return
			try {
				const result = await deleteGatesBatch({
					source_gate_ids: gates.map((g) => g.id),
					scope: "file",
					recursive: true,
				})
				toast.success(`${result.deleted} gate(s) excluído(s)`)
				loadFile()
			} catch (error: unknown) {
				toast.error(`Erro ao excluir gates: ${extractErrorMessage(error)}`)
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
				if (scope !== "file") {
					toast.success(
						`Gate atualizado em ${result.propagated_gate_ids.length + 1} amostra(s)`,
					)
					if (result.conflicts.length > 0) {
						toast.warn(
							`Nome já usado em: ${result.conflicts
								.map((conflict) => conflict.file_name)
								.join(", ")}`,
						)
					}
				} else {
					toast.success("Gate atualizado com sucesso!")
				}
				loadFile()
				return null
			} catch (error: unknown) {
				return extractErrorMessage(error)
			}
		},
		[loadFile],
	)

	return { patchCoordinates, deleteGate, deleteGates, saveGateNameColor }
}
