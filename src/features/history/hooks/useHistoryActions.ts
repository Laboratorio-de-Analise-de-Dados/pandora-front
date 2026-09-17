import { useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import {
	createCheckpoint,
	discardCheckpoint,
	renameCheckpoint,
	restoreToCheckpoint,
	restoreToRevision,
	revertRevision,
} from "../../../services/historyService"
import type {
	AnalysisCheckpoint,
	RestoreAppliedResponse,
	RestorePlan,
} from "../../../services/historyService"
import { useExperimentWorkspace } from "../../experiment/context/ExperimentWorkspaceContext"
import { extractErrorMessage } from "../../../utils/apiError"

export interface RestoreTarget {
	/** Revisão-âncora do ponto (borda de sessão ou revisão avulsa). */
	revisionId: number | null
	/** Quando o alvo é um checkpoint fixado, o restore usa o endpoint dele. */
	checkpointId?: number
	/** Rótulo humano do ponto para os diálogos. */
	label: string
}

function isApplied(
	res: RestorePlan | RestoreAppliedResponse,
): res is RestoreAppliedResponse {
	return "applied" in res
}

/**
 * Ações de histórico: pin/descartar checkpoint, revert unitário e restore
 * por ponto. Restore/revert passam sempre por dry-run antes do confirm —
 * o chamador guarda o plano e o conflito para o diálogo.
 */
export function useHistoryActions() {
	const { experiment, invalidateExperiment } = useExperimentWorkspace()
	const queryClient = useQueryClient()
	const experimentId = experiment?.id

	const invalidateAll = useCallback(() => {
		invalidateExperiment()
		queryClient.invalidateQueries({ queryKey: ["history", experimentId] })
		queryClient.invalidateQueries({ queryKey: ["checkpoints", experimentId] })
		queryClient.invalidateQueries({ queryKey: ["file-stats"] })
		queryClient.invalidateQueries({ queryKey: ["revision-state"] })
	}, [invalidateExperiment, queryClient, experimentId])

	const pinMutation = useMutation({
		mutationFn: async (payload: {
			message?: string
			revision_id?: number | null
		}) => createCheckpoint(experimentId as number, payload),
		onSuccess: () => {
			toast.success("Ponto salvo no histórico.")
			queryClient.invalidateQueries({ queryKey: ["history", experimentId] })
			queryClient.invalidateQueries({
				queryKey: ["checkpoints", experimentId],
			})
		},
		onError: (error) =>
			toast.error(`Erro ao salvar ponto: ${extractErrorMessage(error)}`),
	})

	const renameMutation = useMutation({
		mutationFn: async (payload: { checkpointId: number; message: string }) =>
			renameCheckpoint(payload.checkpointId, payload.message),
		onSuccess: () => {
			toast.success("Checkpoint renomeado.")
			queryClient.invalidateQueries({
				queryKey: ["checkpoints", experimentId],
			})
			queryClient.invalidateQueries({ queryKey: ["history", experimentId] })
		},
		onError: (error) =>
			toast.error(`Erro ao renomear: ${extractErrorMessage(error)}`),
	})

	const discardMutation = useMutation({
		mutationFn: async (checkpointId: number) => discardCheckpoint(checkpointId),
		onSuccess: () => {
			toast.success("Checkpoint descartado.")
			queryClient.invalidateQueries({
				queryKey: ["checkpoints", experimentId],
			})
			queryClient.invalidateQueries({ queryKey: ["history", experimentId] })
		},
		onError: (error) =>
			toast.error(`Erro ao descartar: ${extractErrorMessage(error)}`),
	})

	/** Dry-run de restore: devolve o plano composto sem gravar nada. */
	const previewRestore = useCallback(
		async (target: RestoreTarget): Promise<RestorePlan | null> => {
			if (!experimentId) return null
			try {
				const res =
					target.checkpointId != null
						? await restoreToCheckpoint(target.checkpointId, {
								dry_run: true,
							})
						: await restoreToRevision(
								experimentId,
								target.revisionId as number,
								{ dry_run: true },
							)
				return res as RestorePlan
			} catch (error) {
				toast.error(
					`Erro ao simular restauração: ${extractErrorMessage(error)}`,
				)
				return null
			}
		},
		[experimentId],
	)

	/**
	 * Restore real. Em conflito o backend devolve 409 — o chamador lê
	 * `conflicts` e decide se oferece "Sobrescrever alterações" (force).
	 */
	const confirmRestore = useCallback(
		async (
			target: RestoreTarget,
			force: boolean,
		): Promise<{ conflicts?: unknown[] } | null> => {
			if (!experimentId) return null
			try {
				const res =
					target.checkpointId != null
						? await restoreToCheckpoint(target.checkpointId, {
								force,
							})
						: await restoreToRevision(
								experimentId,
								target.revisionId as number,
								{ force },
							)
				if (isApplied(res)) {
					toast.success(`Estado restaurado até ${target.label}.`)
					invalidateAll()
					return {}
				}
				return { conflicts: res.conflicts }
			} catch (error) {
				const data = (
					error as { response?: { status?: number; data?: unknown } }
				).response
				if (data?.status === 409) {
					const body = data.data as RestorePlan
					return { conflicts: body.conflicts }
				}
				toast.error(`Erro ao restaurar: ${extractErrorMessage(error)}`)
				return null
			}
		},
		[experimentId, invalidateAll],
	)

	/** Dry-run do revert unitário (BE-08). */
	const previewRevert = useCallback(async (revisionId: number) => {
		try {
			return await revertRevision(revisionId, true)
		} catch (error) {
			toast.error(`Erro ao simular reversão: ${extractErrorMessage(error)}`)
			return null
		}
	}, [])

	/** Revert real — conflito bloqueia (o backend não aceita force aqui). */
	const confirmRevert = useCallback(
		async (revisionId: number): Promise<{ conflicts?: unknown[] } | null> => {
			try {
				await revertRevision(revisionId, false)
				toast.success("Revisão revertida.")
				invalidateAll()
				return {}
			} catch (error) {
				const data = (
					error as { response?: { status?: number; data?: unknown } }
				).response
				if (data?.status === 409) {
					const body = data.data as {
						conflicts?: unknown[]
					}
					return { conflicts: body.conflicts ?? [] }
				}
				toast.error(`Erro ao reverter: ${extractErrorMessage(error)}`)
				return null
			}
		},
		[invalidateAll],
	)

	return {
		pinMutation,
		renameMutation,
		discardMutation,
		previewRestore,
		confirmRestore,
		previewRevert,
		confirmRevert,
	}
}
