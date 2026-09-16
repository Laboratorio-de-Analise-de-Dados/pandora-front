import { useCallback } from "react"
import { toast } from "react-toastify"
import {
	archiveSubsample,
	createSubsample,
	renameSubsample,
	updateSubsampleControl,
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

	/**
	 * Marca o subsample como controle de compensação (BE-22). Devolve a
	 * mensagem de erro para o diálogo — o backend valida unstained único,
	 * canal fluorescente e duplicidade de single-stain (400).
	 */
	const handleSetSubsampleControl = useCallback(
		async (
			subsampleId: number,
			payload: {
				control_type: "unstained" | "single_stain" | null
				control_channel?: string
			},
		): Promise<string | null> => {
			try {
				await updateSubsampleControl(experimentId, subsampleId, payload)
				toast.success(
					payload.control_type
						? "Subsample marcado como controle."
						: "Marcação de controle removida.",
				)
				invalidateExperiment()
				return null
			} catch (error) {
				return extractErrorMessage(error)
			}
		},
		[experimentId, invalidateExperiment],
	)

	return {
		handleCreateSubsample,
		handleRenameSubsample,
		handleArchiveSubsample,
		handleSetSubsampleControl,
	}
}
