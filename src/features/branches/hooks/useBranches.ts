import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { toast } from "react-toastify"
import {
	archiveBranch,
	createBranch,
	fetchBranches,
	renameBranch,
} from "../../../services/branches"
import type { AnalysisBranch } from "../../../services/branches"
import { extractErrorMessage } from "../../../utils/apiError"

export function useBranchesQuery(experimentId: number | undefined) {
	return useQuery<AnalysisBranch[]>({
		queryKey: ["branches", experimentId],
		queryFn: () => fetchBranches(experimentId as number),
		enabled: !!experimentId,
	})
}

/** Ordem estável: main primeiro, depois por criação. */
export function sortBranches(branches: AnalysisBranch[]): AnalysisBranch[] {
	return [...branches].sort((a, b) =>
		a.is_main === b.is_main ? 0 : a.is_main ? -1 : 1,
	)
}

export function useBranchActions(experimentId: number | undefined) {
	const queryClient = useQueryClient()

	// Trocar/criar/editar branch muda a árvore de gates e a timeline —
	// as duas queries levam `?branch=` e precisam ser revalidadas.
	const invalidate = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["branches", experimentId] })
		queryClient.invalidateQueries({
			queryKey: ["experiment-files", String(experimentId)],
		})
		queryClient.invalidateQueries({ queryKey: ["history", experimentId] })
	}, [queryClient, experimentId])

	const create = useCallback(
		async (name: string, baseBranchId?: number | null) => {
			try {
				const branch = await createBranch(
					experimentId as number,
					name,
					baseBranchId,
				)
				invalidate()
				return branch
			} catch (error) {
				toast.error(
					extractErrorMessage(error) || "Não foi possível criar a branch.",
				)
				return null
			}
		},
		[experimentId, invalidate],
	)

	const rename = useCallback(
		async (id: number, name: string) => {
			try {
				await renameBranch(id, name)
				invalidate()
				return true
			} catch (error) {
				toast.error(extractErrorMessage(error) || "Não foi possível renomear.")
				return false
			}
		},
		[invalidate],
	)

	const archive = useCallback(
		async (id: number) => {
			try {
				await archiveBranch(id)
				invalidate()
				return true
			} catch (error) {
				toast.error(extractErrorMessage(error) || "Não foi possível arquivar.")
				return false
			}
		},
		[invalidate],
	)

	return { create, rename, archive }
}
