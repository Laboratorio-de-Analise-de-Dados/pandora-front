import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import {
	applyCompensation,
	discardCompensation,
	fetchCompensations,
	fetchEmbeddedCompensation,
	fromHeaderCompensation,
	removeCompensation,
	renameCompensation,
} from "../../../services/compensationService"
import type {
	CompensationMatrix,
	EmbeddedCompensation,
} from "../../../services/compensationService"
import { extractErrorMessage } from "../../../utils/apiError"

/** Matrizes versionadas do experimento (BE-22). */
export function useCompensationsQuery(experimentId: number | undefined) {
	return useQuery<CompensationMatrix[]>({
		queryKey: ["compensations", experimentId],
		queryFn: () => fetchCompensations(experimentId as number),
		enabled: !!experimentId,
	})
}

/** Matriz `$SPILLOVER`/`$COMP` crua dos headers — null quando nenhuma. */
export function useEmbeddedCompensationQuery(experimentId: number | undefined) {
	return useQuery<EmbeddedCompensation | null>({
		queryKey: ["compensation-embedded", experimentId],
		queryFn: () => fetchEmbeddedCompensation(experimentId as number),
		enabled: !!experimentId,
	})
}

/**
 * Ações de compensação. Apply/remove troca o que density/stats/preview
 * leem (a matriz entra na leitura, não no dado) — por isso a invalidação
 * é ampla, espelhando a do histórico.
 */
export function useCompensationActions(experimentId: number | undefined) {
	const queryClient = useQueryClient()

	const invalidateAll = () => {
		queryClient.invalidateQueries({
			queryKey: ["compensations", experimentId],
		})
		queryClient.invalidateQueries({
			queryKey: ["compensation-embedded", experimentId],
		})
		queryClient.invalidateQueries({ queryKey: ["history", experimentId] })
		queryClient.invalidateQueries({ queryKey: ["density"] })
		queryClient.invalidateQueries({ queryKey: ["file-stats"] })
		queryClient.invalidateQueries({ queryKey: ["fileStats"] })
		queryClient.invalidateQueries({
			queryKey: ["experiment", String(experimentId)],
		})
		queryClient.invalidateQueries({
			queryKey: ["experiment-files", String(experimentId)],
		})
		queryClient.invalidateQueries({
			queryKey: ["experiment-preview", experimentId],
		})
		queryClient.invalidateQueries({ queryKey: ["revision-state"] })
	}

	const toastError = (action: string) => (error: unknown) =>
		toast.error(`Erro ao ${action}: ${extractErrorMessage(error)}`)

	const fromHeaderMutation = useMutation({
		mutationFn: (payload: { name?: string; apply?: boolean }) =>
			fromHeaderCompensation(experimentId as number, payload),
		onSuccess: (matrix) => {
			toast.success(
				matrix.is_applied
					? `Compensação "${matrix.name}" importada e aplicada.`
					: `Matriz "${matrix.name}" importada do arquivo.`,
			)
			invalidateAll()
		},
		onError: toastError("importar a matriz do arquivo"),
	})

	const applyMutation = useMutation({
		mutationFn: (matrixId: number) =>
			applyCompensation(experimentId as number, matrixId),
		onSuccess: () => {
			toast.success("Compensação aplicada.")
			invalidateAll()
		},
		onError: toastError("aplicar a compensação"),
	})

	const removeMutation = useMutation({
		mutationFn: () => removeCompensation(experimentId as number),
		onSuccess: () => {
			toast.success("Compensação removida.")
			invalidateAll()
		},
		onError: toastError("remover a compensação"),
	})

	const renameMutation = useMutation({
		mutationFn: (payload: { matrixId: number; name: string }) =>
			renameCompensation(payload.matrixId, payload.name),
		onSuccess: () => {
			toast.success("Matriz renomeada.")
			invalidateAll()
		},
		onError: toastError("renomear a matriz"),
	})

	const discardMutation = useMutation({
		mutationFn: (matrixId: number) => discardCompensation(matrixId),
		onSuccess: () => {
			toast.success("Matriz descartada.")
			invalidateAll()
		},
		onError: toastError("descartar a matriz"),
	})

	return {
		fromHeaderMutation,
		invalidateAll,
		applyMutation,
		removeMutation,
		renameMutation,
		discardMutation,
	}
}
