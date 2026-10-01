import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../../providers/AuthContext"
import { useExperimentFilesQuery } from "../../experiment/hooks/useExperimentData"
import { fetchFileStats } from "../../../services/experimentService"
import {
	createFigure,
	deleteFigure,
	fetchFigure,
	fetchFigures,
	recomputeFigure,
	updateFigure,
	type FigureCreatePayload,
	type FigureUpdatePayload,
} from "../../../services/figureService"
import type { FigureMockDeps } from "../../../services/figureMock"

/**
 * Dependências do mock de figuras (usadas só quando o endpoint do BE-33
 * responde 404): as amostras do experimento para resolver gates/subsamples
 * e o fetcher de stats de raiz para a população "amostra inteira".
 */
export const useFigureMockDeps = (
	experimentId: number | undefined,
): FigureMockDeps => {
	const { data: files } = useExperimentFilesQuery(
		experimentId ? String(experimentId) : "",
	)
	const { user } = useAuth()
	return useMemo(
		() => ({
			files: files ?? [],
			fetchStats: fetchFileStats,
			currentUserName: user?.username,
		}),
		[files, user],
	)
}

export const useFiguresQuery = (experimentId: number | undefined) => {
	const mockDeps = useFigureMockDeps(experimentId)
	return useQuery({
		queryKey: ["figures", experimentId],
		queryFn: () => fetchFigures(experimentId as number, mockDeps),
		enabled: !!experimentId,
	})
}

export const useFigureQuery = (
	figureId: number | undefined,
	mockDeps: FigureMockDeps,
) =>
	useQuery({
		queryKey: ["figure", figureId],
		queryFn: () => fetchFigure(figureId as number, mockDeps),
		enabled: !!figureId,
	})

export const useFigureMutations = (
	experimentId: number,
	mockDeps: FigureMockDeps,
) => {
	const queryClient = useQueryClient()
	const invalidate = (figureId?: number) => {
		queryClient.invalidateQueries({ queryKey: ["figures", experimentId] })
		if (figureId !== undefined) {
			queryClient.invalidateQueries({ queryKey: ["figure", figureId] })
		}
	}

	const create = useMutation({
		mutationFn: (payload: FigureCreatePayload) =>
			createFigure(experimentId, payload, mockDeps),
		onSuccess: (figure) => invalidate(figure.id),
	})

	const update = useMutation({
		mutationFn: ({
			figureId,
			payload,
		}: {
			figureId: number
			payload: FigureUpdatePayload
		}) => updateFigure(figureId, payload, mockDeps),
		onSuccess: (figure) => invalidate(figure.id),
	})

	const remove = useMutation({
		mutationFn: (figureId: number) => deleteFigure(figureId),
		onSuccess: () => invalidate(),
	})

	const recompute = useMutation({
		mutationFn: (figureId: number) => recomputeFigure(figureId, mockDeps),
		onSuccess: (result) => invalidate(result.figure.id),
	})

	return { create, update, remove, recompute }
}
