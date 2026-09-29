import type { AnalysisResultData, ExperimentFiles } from "../types"
import { findGateByPathNames } from "../features/gate/utils"
import {
	metricValue,
	ROOT_POPULATION,
} from "../features/analysis/utils/figureSeries"
import type {
	AnalysisFigure,
	AnalysisFigureListItem,
	FigureCreatePayload,
	FigureRecomputeResult,
	FigureResultCache,
	FigureResultRow,
	FigureSpec,
	FigureUpdatePayload,
} from "./figureService"

/**
 * Mock de desenvolvimento do BE-33 (figuras de análise). Ativado quando os
 * endpoints `/analytics/.../figures/` respondem 404 — mesmo contrato frozen
 * do PRD, então ao chegar o backend basta remover o fallback no service.
 *
 * O `result_cache` é computado de verdade a partir das stats já existentes
 * (`analysis_result` dos gates + stats de raiz), e a loja persiste em
 * localStorage para a figura sobreviver a reloads durante o dev.
 */

export interface FigureMockDeps {
	files: ExperimentFiles[]
	fetchStats: (fileId: number) => Promise<AnalysisResultData>
	currentUserName?: string
}

const STORE_KEY = "pandora-mock-figures-v1"

/** Figuras persistidas, indexadas por experimentId. */
type Store = Record<number, AnalysisFigure[]>

let cache: Store | null = null

const load = (): Store => {
	if (cache) return cache
	try {
		cache = JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}") as Store
	} catch {
		cache = {}
	}
	return cache
}

const persist = (store: Store) => {
	cache = store
	try {
		localStorage.setItem(STORE_KEY, JSON.stringify(store))
	} catch {
		// localStorage indisponível/cheio — a sessão segue com a loja em memória.
	}
}

const touch = (store: Store) => persist({ ...store })

/** Testes — zera a loja em memória e o localStorage. */
export const resetFigureMockStore = () => {
	cache = null
	try {
		localStorage.removeItem(STORE_KEY)
	} catch {
		// ambiente sem localStorage
	}
}

const findFigure = (
	store: Store,
	figureId: number,
): { figure: AnalysisFigure; experimentId: number } | undefined => {
	for (const [expId, figures] of Object.entries(store)) {
		const figure = figures.find((f) => f.id === figureId)
		if (figure) return { figure, experimentId: Number(expId) }
	}
	return undefined
}

const nextId = (store: Store): number =>
	Math.max(
		0,
		...Object.values(store)
			.flat()
			.map((f) => f.id),
	) + 1

/**
 * Sincronamente resolve cada população do spec para cada amostra dos grupos:
 * `"."` → a própria amostra; `"A/B"` → gate por caminho de nomes.
 * Serve tanto para a fingerprint de staleness quanto para a contagem de
 * `resolved_inputs`/`unmatched` (sem precisar de stats).
 */
const resolveInputs = (
	spec: FigureSpec,
	files: ExperimentFiles[],
): {
	resolved: { file: ExperimentFiles; population: string; gateId?: number }[]
	unmatchedFiles: number[]
	unmatchedPopulations: string[]
} => {
	const resolved: {
		file: ExperimentFiles
		population: string
		gateId?: number
	}[] = []
	const unmatchedFiles = new Set<number>()
	const popHit = new Map<string, number>()

	const referenced = new Set<number>()
	for (const group of spec.groups) {
		for (const fileId of group.file_data_ids) referenced.add(fileId)
	}

	for (const fileId of referenced) {
		const file = files.find((f) => f.id === fileId && f.active !== false)
		if (!file) {
			unmatchedFiles.add(fileId)
			continue
		}
		for (const pop of spec.populations) {
			if (pop === ROOT_POPULATION) {
				resolved.push({ file, population: pop })
				popHit.set(pop, (popHit.get(pop) ?? 0) + 1)
				continue
			}
			const gate = findGateByPathNames(file.gates, pop.split("/"))
			if (gate) {
				resolved.push({ file, population: pop, gateId: gate.id })
				popHit.set(pop, (popHit.get(pop) ?? 0) + 1)
			} else {
				unmatchedFiles.add(fileId)
			}
		}
	}

	return {
		resolved,
		unmatchedFiles: [...unmatchedFiles],
		unmatchedPopulations: spec.populations.filter((p) => !popHit.get(p)),
	}
}

/** Fingerprint de entradas resolvidas — divergir do cache = figura stale. */
const inputsFingerprint = (resolved_inputs: {
	gate_ids: number[]
	file_data_ids: number[]
}): string =>
	JSON.stringify([
		[...resolved_inputs.gate_ids].sort((a, b) => a - b),
		[...resolved_inputs.file_data_ids].sort((a, b) => a - b),
	])

const computeCache = async (
	spec: FigureSpec,
	deps: FigureMockDeps,
): Promise<FigureResultCache> => {
	const { resolved, unmatchedFiles } = resolveInputs(spec, deps.files)
	const rows: FigureResultRow[] = []
	const gateIds = new Set<number>()
	const fileIds = new Set<number>()
	const nPorGrupo: Record<string, number> = {}
	const groupByFile = new Map<number, string>()
	for (const group of spec.groups) {
		for (const fileId of group.file_data_ids)
			groupByFile.set(fileId, group.name)
	}

	for (const r of resolved) {
		const ar =
			r.population === ROOT_POPULATION
				? await deps.fetchStats(r.file.id)
				: findGateByPathNames(r.file.gates, r.population.split("/"))
						?.analysis_result?.analysis_result
		const value = metricValue(ar, spec.metric, spec.channel)
		if (value === undefined) {
			unmatchedFiles.push(r.file.id)
			continue
		}
		const group = groupByFile.get(r.file.id) ?? ""
		rows.push({
			group,
			file_data_id: r.file.id,
			file_name: r.file.file_name,
			population: r.population,
			value,
		})
		if (r.gateId !== undefined) gateIds.add(r.gateId)
		fileIds.add(r.file.id)
		nPorGrupo[group] = (nPorGrupo[group] ?? 0) + 1
	}

	return {
		rows,
		resolved_inputs: {
			gate_ids: [...gateIds],
			file_data_ids: [...fileIds],
			channel: spec.channel,
		},
		unmatched: {
			populations: spec.populations.filter(
				(p) => !rows.some((r) => r.population === p),
			),
			files: [...new Set(unmatchedFiles)],
		},
		meta: {
			n_por_grupo: nPorGrupo,
			computed_at: new Date().toISOString(),
		},
	}
}

/** Marca `is_stale` comparando a resolução atual com a do cache salvo. */
const withStaleness = (
	figure: AnalysisFigure,
	deps: FigureMockDeps,
): AnalysisFigure => {
	if (!figure.result_cache) return { ...figure, is_stale: true }
	const { resolved, unmatchedFiles } = resolveInputs(figure.spec, deps.files)
	const gateIds = new Set(resolved.flatMap((r) => (r.gateId ? [r.gateId] : [])))
	const fileIds = new Set([
		...resolved.map((r) => r.file.id),
		...unmatchedFiles,
	])
	const current = inputsFingerprint({
		gate_ids: [...gateIds],
		file_data_ids: [...fileIds],
	})
	const stale =
		figure.is_stale ||
		current !== inputsFingerprint(figure.result_cache.resolved_inputs)
	return { ...figure, is_stale: stale }
}

const toListItem = (f: AnalysisFigure): AnalysisFigureListItem => ({
	id: f.id,
	name: f.name,
	chart_type: f.chart_type,
	updated_at: f.updated_at,
	is_stale: f.is_stale,
	published: f.published,
	created_by_name: f.created_by_name,
})

export const mockListFigures = async (
	experimentId: number,
	deps: FigureMockDeps,
): Promise<AnalysisFigureListItem[]> => {
	const store = load()
	return (store[experimentId] ?? []).map((f) =>
		toListItem(withStaleness(f, deps)),
	)
}

export const mockGetFigure = async (
	figureId: number,
	deps: FigureMockDeps,
): Promise<AnalysisFigure> => {
	const found = findFigure(load(), figureId)
	if (!found) throw new Error("Figura não encontrada.")
	return withStaleness(found.figure, deps)
}

export const mockCreateFigure = async (
	experimentId: number,
	payload: FigureCreatePayload,
	deps: FigureMockDeps,
): Promise<AnalysisFigure> => {
	const store = load()
	const figures = store[experimentId] ?? []
	if (figures.some((f) => f.name === payload.name)) {
		throw new Error("Já existe uma figura com este nome.")
	}
	const now = new Date().toISOString()
	const figure: AnalysisFigure = {
		id: nextId(store),
		name: payload.name,
		chart_type: payload.chart_type,
		spec: payload.spec,
		result_cache: await computeCache(payload.spec, deps),
		result_revision: 1,
		is_stale: false,
		published: false,
		created_by_name: deps.currentUserName ?? null,
		created_at: now,
		updated_at: now,
	}
	persist({ ...store, [experimentId]: [...figures, figure] })
	return figure
}

export const mockUpdateFigure = async (
	figureId: number,
	payload: FigureUpdatePayload,
	deps: FigureMockDeps,
): Promise<AnalysisFigure> => {
	const store = load()
	const found = findFigure(store, figureId)
	if (!found) throw new Error("Figura não encontrada.")
	const { figure, experimentId } = found
	if (figure.published && (payload.name !== undefined || payload.spec)) {
		throw new Error("Figura publicada — despublique para alterar.")
	}
	if (
		payload.updated_at !== undefined &&
		payload.updated_at !== figure.updated_at
	) {
		throw new Error(
			"A figura foi alterada por outra sessão — recarregue antes de salvar.",
		)
	}
	const updated: AnalysisFigure = {
		...figure,
		name: payload.name ?? figure.name,
		spec: payload.spec ?? figure.spec,
		published: payload.published ?? figure.published,
		is_stale: payload.spec ? true : figure.is_stale,
		updated_at: new Date().toISOString(),
	}
	touch({
		...store,
		[experimentId]: store[experimentId].map((f) =>
			f.id === figureId ? updated : f,
		),
	})
	return withStaleness(updated, deps)
}

export const mockDeleteFigure = (figureId: number): void => {
	const store = load()
	const found = findFigure(store, figureId)
	if (!found) throw new Error("Figura não encontrada.")
	touch({
		...store,
		[found.experimentId]: store[found.experimentId].filter(
			(f) => f.id !== figureId,
		),
	})
}

export const mockRecomputeFigure = async (
	figureId: number,
	deps: FigureMockDeps,
): Promise<FigureRecomputeResult> => {
	const store = load()
	const found = findFigure(store, figureId)
	if (!found) throw new Error("Figura não encontrada.")
	const { figure, experimentId } = found

	const prevRows = figure.result_cache?.rows ?? []
	const prevFileNames = new Map(
		prevRows.map((r) => [r.file_data_id, r.file_name]),
	)

	const result_cache = await computeCache(figure.spec, deps)

	const removedPopulations = figure.spec.populations.filter(
		(p) =>
			prevRows.some((r) => r.population === p) &&
			!result_cache.rows.some((r) => r.population === p),
	)
	const removedFileIds = [
		...new Set(prevRows.map((r) => r.file_data_id)),
	].filter((id) => !result_cache.rows.some((r) => r.file_data_id === id))

	const updated: AnalysisFigure = {
		...figure,
		result_cache,
		result_revision: (figure.result_revision ?? 0) + 1,
		is_stale: false,
		updated_at: new Date().toISOString(),
	}
	touch({
		...store,
		[experimentId]: store[experimentId].map((f) =>
			f.id === figureId ? updated : f,
		),
	})

	return {
		figure: updated,
		removed_since_last: {
			populations: removedPopulations,
			files: removedFileIds.map((file_data_id) => ({
				file_data_id,
				file_name: prevFileNames.get(file_data_id) ?? `#${file_data_id}`,
			})),
		},
	}
}
