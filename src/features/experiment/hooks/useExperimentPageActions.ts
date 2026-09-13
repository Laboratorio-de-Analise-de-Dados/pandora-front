import { useCallback, useRef, useState } from "react"
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
	deleteGatesBatch,
	updateGate,
} from "../../../services/gateService"
import type { ApplyGateConflict } from "../../../services/gateService"
import type {
	DeleteGateOptions,
	DeleteGateTarget,
} from "../../../components/delete_gate_dialog"
import {
	findFileForGate,
	findGateByPathNames,
	getGatePathNames,
} from "../../gate/utils"
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
	const [applyConflicts, setApplyConflicts] = useState<ApplyGateConflict[]>([])
	const pendingApply = useRef<{
		targetFileDataIds: number[]
		recursive: boolean
	} | null>(null)
	const [savingExperiment, setSavingExperiment] = useState(false)
	const [deleteGateTarget, setDeleteGateTarget] =
		useState<DeleteGateTarget | null>(null)
	const [deleteGateLoading, setDeleteGateLoading] = useState(false)
	const [deleteGateError, setDeleteGateError] = useState<string | null>(null)

	// Espelha a regra do backend: criador, super admin ou membro do lab do
	// experimento podem editar/excluir.
	const canEditExperiment = Boolean(
		experiment &&
		user &&
		(user.is_super_admin ||
			experiment.created_by === user.id ||
			user.memberships.some(
				(membership) =>
					membership.organization.id === experiment.organization?.id,
			)),
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

	const handleRequestDeleteGate = useCallback(
		(gateId: number, gateName: string) => {
			const file = findFileForGate(experimentFiles, gateId)
			setDeleteGateError(null)
			setDeleteGateTarget({
				id: gateId,
				name: gateName,
				fileDataId: file?.id ?? 0,
			})
		},
		[experimentFiles],
	)

	/** Sobe a seleção para o parent do gate apagado (que nunca é atingido). */
	const selectParentOfDeletedGate = useCallback(
		(target: DeleteGateTarget) => {
			const file = experimentFiles.find((f) => f.id === target.fileDataId)
			if (!file) {
				setSource(undefined)
				return
			}
			const path = getGatePathNames(file.gates, target.id) ?? []
			const parent = findGateByPathNames(file.gates, path.slice(0, -1))
			setSource(
				parent
					? {
							type: "gate",
							id: parent.id,
							name: parent.name,
							fileDataId: file.id,
						}
					: {
							type: "file",
							id: file.id,
							name: file.file_name,
							fileDataId: file.id,
						},
			)
		},
		[experimentFiles, setSource],
	)

	const handleConfirmDeleteGate = useCallback(
		async (options: DeleteGateOptions) => {
			if (!deleteGateTarget) return
			setDeleteGateLoading(true)
			try {
				const result = await deleteGatesBatch({
					source_gate_ids: [deleteGateTarget.id],
					scope: options.scope,
					target_file_data_ids:
						options.scope === "experiment"
							? options.targetFileDataIds
							: undefined,
					recursive: options.recursive,
					include_source: options.includeSource,
				})
				toast.success(
					`${result.deleted} gate(s) excluído(s) em ${result.details.length} amostra(s).`,
					{ position: "bottom-right" },
				)
				const sourceWasDeleted =
					(options.scope === "file" || options.includeSource) &&
					source?.type === "gate" &&
					source.id === deleteGateTarget.id
				if (sourceWasDeleted) selectParentOfDeletedGate(deleteGateTarget)
				setDeleteGateTarget(null)
				invalidateExperiment()
			} catch (error) {
				setDeleteGateError(extractErrorMessage(error))
			} finally {
				setDeleteGateLoading(false)
			}
		},
		[deleteGateTarget, invalidateExperiment, selectParentOfDeletedGate, source],
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
				toast.error(
					`Erro ao desabilitar a amostra: ${extractErrorMessage(error)}`,
					{
						position: "bottom-right",
					},
				)
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
				toast.error(
					`Erro ao reativar a amostra: ${extractErrorMessage(error)}`,
					{
						position: "bottom-right",
					},
				)
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

	const runApply = useCallback(
		async (
			targetFileDataIds: number[],
			recursive: boolean,
			onConflict: "replace" | "rename",
		) => {
			if (!applyTarget) return
			setApplyLoading(true)
			try {
				const result = await applyGates({
					source_gate_ids: [applyTarget.id],
					target_file_data_ids: targetFileDataIds,
					recursive,
					on_conflict: onConflict,
				})
				toast.success(
					`Gates aplicados: ${result.created} criado(s), ${result.replaced} sobrescrito(s)`,
					{ position: "bottom-right" },
				)
				setApplyConflicts([])
				pendingApply.current = null
				setApplyTarget(null)
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao aplicar gates: ${extractErrorMessage(error)}`, {
					position: "bottom-right",
				})
			} finally {
				setApplyLoading(false)
			}
		},
		[applyTarget, invalidateExperiment],
	)

	// Antes de aplicar, um dry run descobre os gates de mesmo nome que seriam
	// sobrescritos nos destinos; a sobrescrita só acontece após confirmação.
	const handleConfirmApply = useCallback(
		async (targetFileDataIds: number[], recursive: boolean) => {
			if (!applyTarget) return
			setApplyLoading(true)
			try {
				const preview = await applyGates({
					source_gate_ids: [applyTarget.id],
					target_file_data_ids: targetFileDataIds,
					recursive,
					dry_run: true,
				})
				if (preview.conflicts.length > 0) {
					pendingApply.current = { targetFileDataIds, recursive }
					setApplyConflicts(preview.conflicts)
					return
				}
			} catch (error) {
				toast.error(`Erro ao aplicar gates: ${extractErrorMessage(error)}`, {
					position: "bottom-right",
				})
				return
			} finally {
				setApplyLoading(false)
			}
			await runApply(targetFileDataIds, recursive, "rename")
		},
		[applyTarget, runApply],
	)

	const handleResolveApplyConflicts = useCallback(
		(resolution: "replace" | "rename" | null) => {
			const pending = pendingApply.current
			setApplyConflicts([])
			pendingApply.current = null
			if (!pending || !resolution) return
			void runApply(pending.targetFileDataIds, pending.recursive, resolution)
		},
		[runApply],
	)

	return {
		handleDelete,
		handleRequestDeleteGate,
		handleConfirmDeleteGate,
		deleteGateTarget,
		deleteGateLoading,
		deleteGateError,
		setDeleteGateTarget,
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
		applyConflicts,
		handleResolveApplyConflicts,
	}
}
