import { useCallback } from "react"
import { toast } from "react-toastify"
import { updateFileChannelLabels } from "../../../services/experimentService"
import { extractErrorMessage } from "../../../utils/apiError"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"

/**
 * FE-51: gravação de labels custom de canal (BE-47) — por arquivo, merge
 * por chave (`null` remove). Invalida o workspace ao salvar; o erro vira
 * toast e segue lançado para o chamador manter o dialog aberto.
 */
export function useChannelLabels() {
	const { invalidateExperiment } = useExperimentWorkspace()

	const saveChannelLabels = useCallback(
		async (fileDataId: number, labels: Record<string, string | null>) => {
			try {
				await updateFileChannelLabels(fileDataId, labels)
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao salvar labels: ${extractErrorMessage(error)}`)
				throw error
			}
		},
		[invalidateExperiment],
	)

	return { saveChannelLabels }
}
