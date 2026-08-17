import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { deleteExperiment } from "../../../services/experimentService"
import {
	applyGates,
	deleteGate,
	updateGate,
} from "../../../services/gateService"
import { findFileForGate } from "../../gate/utils"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"

export interface ApplyTarget {
	id: number
	name: string
	fileDataId: number
}

export function useExperimentPageActions() {
	const navigate = useNavigate()
	const {
		experiment,
		experimentFiles,
		source,
		setSource,
		invalidateExperiment,
	} = useExperimentWorkspace()

	const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null)
	const [applyLoading, setApplyLoading] = useState(false)

	const handleDelete = useCallback(async () => {
		if (!experiment) return
		const confirmed = window.confirm("Tem certeza que deseja excluir?")
		if (!confirmed) return
		try {
			await deleteExperiment(experiment.id)
			toast.success("Experimento excluído com sucesso!", {
				position: "bottom-right",
			})
			navigate("/experiments")
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao excluir o experimento: ${errorMessage}`, {
				position: "bottom-right",
			})
		}
	}, [experiment, navigate])

	const handleDeleteGate = useCallback(
		async (gateId: number) => {
			try {
				await deleteGate(gateId)
				toast.success("Gate excluído com sucesso!", {
					position: "bottom-right",
				})
				if (source?.type === "gate" && source.id === gateId) {
					setSource(undefined)
				}
				invalidateExperiment()
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error)
				toast.error(`Erro ao excluir o gate: ${errorMessage}`, {
					position: "bottom-right",
				})
			}
		},
		[invalidateExperiment, setSource, source],
	)

	const handleRenameGate = useCallback(
		async (gateId: number, newName: string) => {
			try {
				await updateGate(gateId, { name: newName })
				toast.success("Gate renomeado com sucesso!", {
					position: "bottom-right",
				})
				invalidateExperiment()
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error)
				toast.error(`Erro ao renomear o gate: ${errorMessage}`, {
					position: "bottom-right",
				})
			}
		},
		[invalidateExperiment],
	)

	const handleApplyGate = useCallback(
		(gateId: number, gateName: string) => {
			const file = findFileForGate(experimentFiles, gateId)
			setApplyTarget({
				id: gateId,
				name: gateName,
				fileDataId: file?.id ?? 0,
			})
		},
		[experimentFiles],
	)

	const handleConfirmApply = useCallback(
		async (targetFileDataIds: number[], recursive: boolean) => {
			if (!applyTarget) return
			setApplyLoading(true)
			try {
				await applyGates({
					source_gate_ids: [applyTarget.id],
					target_file_data_ids: targetFileDataIds,
					recursive,
					on_conflict: "replace",
				})
				toast.success("Gates aplicados com sucesso!", {
					position: "bottom-right",
				})
				setApplyTarget(null)
				invalidateExperiment()
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error)
				toast.error(`Erro ao aplicar gates: ${errorMessage}`, {
					position: "bottom-right",
				})
			} finally {
				setApplyLoading(false)
			}
		},
		[applyTarget, invalidateExperiment],
	)

	return {
		handleDelete,
		handleDeleteGate,
		handleRenameGate,
		handleApplyGate,
		handleConfirmApply,
		applyTarget,
		applyLoading,
		setApplyTarget,
	}
}
