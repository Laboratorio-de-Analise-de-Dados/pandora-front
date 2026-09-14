import { useCallback } from "react"
import { toast } from "react-toastify"
import {
	archiveSubsample,
	createSubsample,
	renameSubsample,
} from "../../../services/subsampleService"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"
import { extractErrorMessage } from "../../../utils/apiError"

/**
 * Ações sobre subsamples (BE-07): create/rename devolvem mensagem de erro
 * para o campo do diálogo (nome duplicado vira 400 na API); archive toasteia
 * e invalida.
 */
export function useSubsampleActions() {
	const { experimentId, invalidateExperiment } = useExperimentWorkspace()

	const handleCreateSubsample = useCallback(
		async (name: string): Promise<string | null> => {
			try {
				await createSubsample(experimentId, name)
				toast.success("Subsample criado")
				invalidateExperiment()
				return null
			} catch (error) {
				return extractErrorMessage(error)
			}
		},
		[experimentId, invalidateExperiment],
	)

	const handleRenameSubsample = useCallback(
		async (subsampleId: number, name: string): Promise<string | null> => {
			try {
				await renameSubsample(experimentId, subsampleId, name)
				toast.success("Subsample renomeado")
				invalidateExperiment()
				return null
			} catch (error) {
				return extractErrorMessage(error)
			}
		},
		[experimentId, invalidateExperiment],
	)

	const handleArchiveSubsample = useCallback(
		async (subsampleId: number) => {
			try {
				await archiveSubsample(experimentId, subsampleId)
				toast.success("Subsample arquivado. As amostras ficaram sem subsample.")
				invalidateExperiment()
			} catch (error) {
				toast.error(
					`Erro ao arquivar o subsample: ${extractErrorMessage(error)}`,
				)
			}
		},
		[experimentId, invalidateExperiment],
	)

	return {
		handleCreateSubsample,
		handleRenameSubsample,
		handleArchiveSubsample,
	}
}
