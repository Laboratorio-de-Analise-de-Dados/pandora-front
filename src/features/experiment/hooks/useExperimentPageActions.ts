import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
	deleteExperiment,
	disableFileData,
	enableFileData,
	updateExperiment,
} from "../../../services/experimentService"
import type { UpdateExperimentPayload } from "../../../services/experimentService"
import { useAuth } from "../../../providers/AuthContext"
import {
	applyGates,
	deleteGate,
	updateGate,
} from "../../../services/gateService"
import { findFileForGate } from "../../gate/utils"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"

const extractErrorMessage = (error: unknown): string => {
	const err = error as {
		response?: { data?: unknown }
		message?: string
	}
	const data = err?.response?.data
	if (data && typeof data === "object") {
		const detail = (data as { detail?: unknown }).detail
		if (typeof detail === "string") return detail
		// Erros de campo do serializer: { title: ["..."], type: ["..."] }
		const fieldErrors = Object.values(data as Record<string, unknown>)
			.flatMap((value) => (Array.isArray(value) ? value : [value]))
			.filter((value): value is string => typeof value === "string")
		if (fieldErrors.length > 0) return fieldErrors.join(" ")
	}
	return err?.message ?? String(error)
}

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

	const { user } = useAuth()

	const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null)
	const [applyLoading, setApplyLoading] = useState(false)
	const [savingExperiment, setSavingExperiment] = useState(false)

	// Espelha a regra do backend: criador, super admin ou membro do lab do
	// experimento podem editar/excluir.
	const canEditExperiment = Boolean(
		experiment &&
			user &&
			(user.is_super_admin ||
				experiment.created_by === user.id ||
				(experiment.organization !== null &&
					user.memberships.some(
						(membership) =>
							membership.organization.id === experiment.organization,
					))),
	)

	const handleUpdateExperiment = useCallback(
		async (payload: UpdateExperimentPayload): Promise<string | null> => {
			if (!experiment) return "Experimento não carregado"
			setSavingExperiment(true)
			try {
				await updateExperiment(experiment.id, payload)
				toast.success("Experimento atualizado!", {
					position: "bottom-right",
				})
				invalidateExperiment()
				return null
			} catch (error) {
				return extractErrorMessage(error)
			} finally {
				setSavingExperiment(false)
			}
		},
		[experiment, invalidateExperiment],
	)

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

	const handleDisableFile = useCallback(
		async (fileDataId: number) => {
			try {
				await disableFileData(fileDataId)
				toast.success("Amostra desabilitada. Os gates foram preservados.", {
					position: "bottom-right",
				})
				if (source?.fileDataId === fileDataId) {
					const next = experimentFiles.find(
						(file) => file.id !== fileDataId && file.active !== false,
					)
					setSource(
						next
							? {
									type: "file",
									id: next.id,
									name: next.file_name,
									fileDataId: next.id,
								}
							: undefined,
					)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao desabilitar a amostra: ${extractErrorMessage(error)}`, {
					position: "bottom-right",
				})
			}
		},
		[experimentFiles, invalidateExperiment, setSource, source],
	)

	const handleEnableFile = useCallback(
		async (fileDataId: number) => {
			try {
				await enableFileData(fileDataId)
				toast.success("Amostra reativada", { position: "bottom-right" })
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao reativar a amostra: ${extractErrorMessage(error)}`, {
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
		handleDisableFile,
		handleEnableFile,
		handleUpdateExperiment,
		savingExperiment,
		canEditExperiment,
		handleApplyGate,
		handleConfirmApply,
		applyTarget,
		applyLoading,
		setApplyTarget,
	}
}
