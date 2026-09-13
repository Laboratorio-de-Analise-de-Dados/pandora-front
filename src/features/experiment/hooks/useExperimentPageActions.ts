import { useCallback, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import {
	checkFileHash,
	deleteExperiment,
	disableFileData,
	downloadExperiment,
	enableFileData,
	updateExperiment,
} from "../../../services/experimentService"
import type { UpdateExperimentPayload } from "../../../services/experimentService"
import { useAuth } from "../../../providers/AuthContext"
import { useExperimentsContext } from "../../../providers/ExperimentContext"
import { sha256File } from "../../../utils/fileHash"
import {
	ACCEPTED_EXPERIMENT_FILE_MESSAGE,
	isAcceptedExperimentFile,
} from "../../../utils/experimentFile"
import {
	applyGates,
	deleteGatesBatch,
	updateGate,
} from "../../../services/gateService"
import type { ApplyGateConflict } from "../../../services/gateService"
import {
	archiveSubsample,
	createSubsample,
	moveFileToSubsample,
	renameSubsample,
} from "../../../services/subsampleService"
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
import { extractErrorMessage } from "../../../utils/apiError"

export interface ApplyTarget {
	id: number
	name: string
	fileDataId: number
}

export function useExperimentPageActions() {
	const navigate = useNavigate()
	const {
		experiment,
		experimentId,
		experimentFiles,
		source,
		setSource,
		invalidateExperiment,
	} = useExperimentWorkspace()

	const { user } = useAuth()
	const { addExperimentFile } = useExperimentsContext()

	const [addingFile, setAddingFile] = useState(false)
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
				toast.success("Experimento atualizado!")
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

	// DELETE é arquivamento (ADR-0005): o experimento sai das listagens mas
	// dados, gates e subsamples são preservados e ele pode ser reativado.
	const handleDelete = useCallback(async () => {
		if (!experiment) return
		const confirmed = window.confirm(
			"Desativar este experimento? Ele sai das listagens, mas os dados " +
				"são preservados e ele pode ser reativado depois.",
		)
		if (!confirmed) return
		try {
			await deleteExperiment(experiment.id)
			toast.success("Experimento desativado.")
			navigate("/experiments")
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao desativar o experimento: ${errorMessage}`)
		}
	}, [experiment, navigate])

	// BE-12: anexa um ZIP ou .fcs ao experimento. A dedup é escopada a este
	// experimento — o check-hash pergunta antes de subir e o servidor ainda
	// pula amostras duplicadas na extração (reportadas em `skipped`).
	const handleAddFile = useCallback(
		async (file: File) => {
			if (!experiment) return
			if (!isAcceptedExperimentFile(file.name)) {
				toast.error(ACCEPTED_EXPERIMENT_FILE_MESSAGE)
				return
			}
			try {
				const hash = await sha256File(file).catch(() => null)
				if (hash) {
					const check = await checkFileHash(hash, experiment.id)
					if (check.exists) {
						const proceed = window.confirm(
							`"${check.file_name ?? file.name}" já está neste experimento. ` +
								"Enviar mesmo assim? Amostras duplicadas serão ignoradas.",
						)
						if (!proceed) return
					}
				}
			} catch {
				// Sem hash não há aviso — o upload segue e o servidor deduplica.
			}

			setAddingFile(true)
			try {
				const { added, skipped } = await addExperimentFile(experiment.id, file)
				if (skipped.length > 0) {
					toast.warn(
						`${added} amostra(s) adicionada(s); ${skipped.length} ` +
							`já existia(m) no experimento e foram ignoradas.`,
					)
				} else {
					toast.success(
						added === 1
							? "1 amostra adicionada"
							: `${added} amostras adicionadas`,
					)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao enviar o arquivo: ${extractErrorMessage(error)}`)
			} finally {
				setAddingFile(false)
			}
		},
		[experiment, addExperimentFile, invalidateExperiment],
	)

	const handleDownload = useCallback(async () => {
		if (!experiment) return
		try {
			await downloadExperiment(experiment.id, experiment.title)
		} catch (error) {
			toast.error(`Erro ao baixar: ${extractErrorMessage(error)}`)
		}
	}, [experiment])

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
				toast.success("Gate renomeado com sucesso!")
				invalidateExperiment()
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error)
				toast.error(`Erro ao renomear o gate: ${errorMessage}`)
			}
		},
		[invalidateExperiment],
	)

	const handleDisableFile = useCallback(
		async (fileDataIds: number[]) => {
			try {
				// API é uma amostra por chamada — lote = allSettled + um refetch.
				const results = await Promise.allSettled(
					fileDataIds.map((id) => disableFileData(id)),
				)
				const failed = results.filter((r) => r.status === "rejected").length
				const done = fileDataIds.length - failed
				if (failed === 0) {
					toast.success(
						done === 1
							? "Amostra desabilitada. Os gates foram preservados."
							: `${done} amostras desabilitadas. Os gates foram preservados.`,
					)
				} else {
					toast.warn(`${done} desabilitada(s), ${failed} falharam.`)
				}
				if (source && fileDataIds.includes(source.fileDataId)) {
					const next = experimentFiles.find(
						(file) => !fileDataIds.includes(file.id) && file.active !== false,
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
				)
			}
		},
		[experimentFiles, invalidateExperiment, setSource, source],
	)

	const handleEnableFile = useCallback(
		async (fileDataIds: number[]) => {
			try {
				const results = await Promise.allSettled(
					fileDataIds.map((id) => enableFileData(id)),
				)
				const failed = results.filter((r) => r.status === "rejected").length
				const done = fileDataIds.length - failed
				if (failed === 0) {
					toast.success(
						done === 1 ? "Amostra reativada" : `${done} amostras reativadas`,
					)
				} else {
					toast.warn(`${done} reativada(s), ${failed} falharam.`)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao reativar a amostra: ${extractErrorMessage(error)}`)
			}
		},
		[invalidateExperiment],
	)

	// Subsamples (BE-07): create/rename devolvem mensagem de erro para o campo
	// (nome duplicado vira 400 na API); archive/move toasteiam e invalidam.
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

	const handleMoveFileToSubsample = useCallback(
		async (fileDataIds: number[], subsampleId: number | null) => {
			try {
				// A API move uma amostra por PATCH (BE-07) — o lote é N chamadas.
				const results = await Promise.allSettled(
					fileDataIds.map((id) => moveFileToSubsample(id, subsampleId)),
				)
				const failed = results.filter((r) => r.status === "rejected").length
				if (failed === 0) {
					toast.success(
						fileDataIds.length === 1
							? "Amostra movida"
							: `${fileDataIds.length} amostras movidas`,
					)
				} else {
					toast.warn(
						`${fileDataIds.length - failed} movida(s), ${failed} falharam.`,
					)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao mover a amostra: ${extractErrorMessage(error)}`)
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
				)
				setApplyConflicts([])
				pendingApply.current = null
				setApplyTarget(null)
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao aplicar gates: ${extractErrorMessage(error)}`)
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
				toast.error(`Erro ao aplicar gates: ${extractErrorMessage(error)}`)
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
		handleAddFile,
		addingFile,
		handleDownload,
		handleRequestDeleteGate,
		handleConfirmDeleteGate,
		deleteGateTarget,
		deleteGateLoading,
		deleteGateError,
		setDeleteGateTarget,
		handleRenameGate,
		handleDisableFile,
		handleEnableFile,
		handleCreateSubsample,
		handleRenameSubsample,
		handleArchiveSubsample,
		handleMoveFileToSubsample,
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
