import { useCallback, useRef, useState } from "react"
import { toast } from "react-toastify"
import { applyGates, deleteGatesBatch } from "../../../services/gateService"
import type {
	ApplyGateConflict,
	NonEvaluableTarget,
} from "../../../services/gateService"
import type {
	DeleteGateOptions,
	DeleteGateTarget,
} from "../../gate/components/delete-gate-dialog"
import {
	findFileForGate,
	findGateByPathNames,
	getGatePathNames,
} from "../../gate/utils"
import { useGateMutations } from "../../plot/hooks/useGateMutations"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"
import { extractErrorMessage } from "../../../utils/apiError"
import type { GateEditPayload } from "../components/parent-tree/types"

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
	const [applyWarnings, setApplyWarnings] = useState<NonEvaluableTarget[]>([])
	const pendingApply = useRef<{
		targetFileDataIds: number[]
		recursive: boolean
		conflicts: ApplyGateConflict[]
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

	// FE-23: mesma gravação do diálogo do gráfico — nome + cor + escopo opt-in.
	// Devolve a mensagem de erro para o diálogo (que permanece aberto) ou null.
	const { saveGateNameColor } = useGateMutations(invalidateExperiment)
	const handleEditGate = useCallback(
		(gateId: number, payload: GateEditPayload) =>
			saveGateNameColor(gateId, payload.name, payload.color, payload.scope),
		[saveGateNameColor],
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

	// Antes de aplicar, um dry run descobre (a) amostras sem os canais que os
	// gates referenciam — aviso não-bloqueante, BE-18 — e (b) gates de mesmo
	// nome que seriam sobrescritos nos destinos; a sobrescrita só acontece após
	// confirmação.
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
				const warnings = preview.non_evaluable ?? []
				if (warnings.length > 0 || preview.conflicts.length > 0) {
					pendingApply.current = {
						targetFileDataIds,
						recursive,
						conflicts: preview.conflicts,
					}
					if (warnings.length > 0) setApplyWarnings(warnings)
					else setApplyConflicts(preview.conflicts)
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

	// Aviso de canal ausente não bloqueia: confirmado, segue para os conflitos
	// de nome (se houver) ou aplica direto.
	const handleResolveApplyWarnings = useCallback(
		(proceed: boolean) => {
			const pending = pendingApply.current
			setApplyWarnings([])
			if (!pending || !proceed) {
				pendingApply.current = null
				return
			}
			if (pending.conflicts.length > 0) {
				setApplyConflicts(pending.conflicts)
				return
			}
			pendingApply.current = null
			void runApply(pending.targetFileDataIds, pending.recursive, "rename")
		},
		[runApply],
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
		handleEditGate,
		handleApplyGate,
		handleConfirmApply,
		applyTarget,
		applyLoading,
		setApplyTarget,
		applyConflicts,
		applyWarnings,
		handleResolveApplyWarnings,
		handleResolveApplyConflicts,
	}
}
