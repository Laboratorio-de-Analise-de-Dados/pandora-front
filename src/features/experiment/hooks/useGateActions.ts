import { useCallback, useRef, useState } from "react"
import { toast } from "react-toastify"
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
import { extractErrorMessage } from "../../../utils/apiError"

export interface ApplyTarget {
	id: number
	name: string
	fileDataId: number
}

/**
 * Ações sobre gates: renomear, excluir (com diálogo de escopo) e aplicar em
 * lote (com dry run e resolução de conflitos).
 */
export function useGateActions() {
	const { experimentFiles, source, setSource, invalidateExperiment } =
		useExperimentWorkspace()

	const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null)
	const [applyLoading, setApplyLoading] = useState(false)
	const [applyConflicts, setApplyConflicts] = useState<ApplyGateConflict[]>([])
	const pendingApply = useRef<{
		targetFileDataIds: number[]
		recursive: boolean
	} | null>(null)
	const [deleteGateTarget, setDeleteGateTarget] =
		useState<DeleteGateTarget | null>(null)
	const [deleteGateLoading, setDeleteGateLoading] = useState(false)
	const [deleteGateError, setDeleteGateError] = useState<string | null>(null)

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
		handleRequestDeleteGate,
		handleConfirmDeleteGate,
		deleteGateTarget,
		deleteGateLoading,
		deleteGateError,
		setDeleteGateTarget,
		handleRenameGate,
		handleApplyGate,
		handleConfirmApply,
		applyTarget,
		applyLoading,
		setApplyTarget,
		applyConflicts,
		handleResolveApplyConflicts,
	}
}
