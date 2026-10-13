import type { GateSuggestion, SuggestionRun } from "../../../types"

/**
 * FE-42 §4 — escopo da sugestão = população pai + par de canais +
 * amostra. Candidatas de contextos diferentes convivem; aqui só aparecem
 * as pendentes que casam com o que está em tela. Re-pedido no mesmo
 * contexto já chega do back com as anteriores marcadas `accepted=false`
 * (BE-40 — "mesmo contexto substitui"), então o filtro por `accepted`
 * é suficiente.
 */
/**
 * Run 2D casa com o par X×Y em qualquer ordem; run 1D (histograma,
 * FE-45) só casa quando o contexto também é 1D — o caller passa
 * `yAxis=""` no modo histograma, então um run de intervalo nunca
 * "vaza" para o scatter com o mesmo canal no X.
 */
const channelsMatch = (
	runChannels: string[],
	xAxis: string,
	yAxis: string,
): boolean =>
	runChannels.length === 1
		? runChannels[0] === xAxis && yAxis === ""
		: (runChannels[0] === xAxis && runChannels[1] === yAxis) ||
			(runChannels[0] === yAxis && runChannels[1] === xAxis)

/** Candidata pendente junto do run que a gerou (contexto + proveniência). */
export interface ContextSuggestion {
	suggestion: GateSuggestion
	run: SuggestionRun
}

/** Candidatas pendentes do contexto em tela, ordenadas pelo run. */
export const pendingSuggestionsForContext = (
	runs: SuggestionRun[] | undefined,
	fileDataId: number,
	parentId: number | null,
	xAxis: string,
	yAxis: string,
): ContextSuggestion[] =>
	(runs ?? [])
		.filter(
			(r) =>
				r.file_data === fileDataId &&
				(r.parent ?? null) === (parentId ?? null) &&
				channelsMatch(r.channels, xAxis, yAxis),
		)
		.flatMap((r) =>
			(r.suggestions ?? [])
				.filter((s) => s.accepted === null)
				.sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0))
				.map((s) => ({ suggestion: s, run: r })),
		)

/** Runs do contexto ainda em processamento — alimenta o indicador. */
export const activeRunsForContext = (
	runs: SuggestionRun[] | undefined,
	fileDataId: number,
	parentId: number | null,
	xAxis: string,
	yAxis: string,
): SuggestionRun[] =>
	(runs ?? []).filter(
		(r) =>
			r.file_data === fileDataId &&
			(r.parent ?? null) === (parentId ?? null) &&
			channelsMatch(r.channels, xAxis, yAxis) &&
			(r.status === "pending" || r.status === "processing"),
	)

/**
 * Último run concluído do contexto que fechou sem nunca gerar candidatas —
 * resposta honesta do Juvia ("não encontrei separação confiável") exibida
 * como feedback, não erro (FE-42 §6).
 *
 * "Sem candidatas" = `suggestions` vazio, não "sem pendentes": run cujas
 * candidatas foram todas revisadas (BE-40) ou cujas gates já nasceram
 * materializadas (v1, mapeadas como aceitas) não é um run vazio.
 */
export const latestEmptyRun = (
	runs: SuggestionRun[] | undefined,
	fileDataId: number,
	parentId: number | null,
	xAxis: string,
	yAxis: string,
): SuggestionRun | null => {
	const done = (runs ?? [])
		.filter(
			(r) =>
				r.file_data === fileDataId &&
				(r.parent ?? null) === (parentId ?? null) &&
				channelsMatch(r.channels, xAxis, yAxis) &&
				r.status === "done" &&
				(r.suggestions ?? []).length === 0,
		)
		.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
	return done[0] ?? null
}
