import CytometryApi from "../API"
import type {
	AcceptSuggestionPayload,
	AnalysisJob,
	Gate,
	GateSuggestion,
	SuggestRequestPayload,
	SuggestionRun,
} from "../types"

/**
 * v1 do suggest (JV-04 revisto): o pedido entra na fila BE-27 e o worker
 * materializa os gates direto na árvore — sem candidatas pendentes, sem
 * intents, sem controle. `POST experiment/{id}/suggestions/` (run +
 * candidatas + accept/discard) é o contrato do BE-40, fase posterior.
 *
 * O front continua falando em "runs": o AnalysisJob do BE-27 é mapeado
 * para o mesmo shape para polling e feedback não precisarem mudar.
 */
const jobToRun = (job: AnalysisJob): SuggestionRun => {
	const worker = job.result?.worker_result
	const createdIds = job.result?.created_gate_ids ?? job.created_gate_ids ?? []
	const candidates = worker?.candidates ?? []
	const done = job.status === "done"
	return {
		id: job.id,
		file_data: job.file_id,
		parent: job.gate_id ?? null,
		channels: job.channels,
		intent: "separate",
		gate_type: worker?.gate_type ?? "polygon",
		status: job.status,
		detail:
			done && candidates.length === 0
				? (worker?.reason ??
					"Não encontrei separação confiável neste par de canais.")
				: null,
		// v1: as gates nascem materializadas — entram já aceitas para não
		// renderizarem no card de revisão nem caírem no filtro de "run
		// vazio" (que conta candidatas nunca geradas).
		suggestions: candidates.map((c, i) => ({
			id: createdIds[i] ?? -(i + 1),
			run: job.id,
			gate_coordinates: c.gate_coordinates,
			stats: c.stats ?? null,
			sort_index: i,
			accepted: true,
			gate: createdIds[i] ?? null,
		})),
		created_at: job.created_at,
	}
}

/**
 * Enfileira um job na fila BE-27 (`POST /analytics/analysis-jobs/`).
 * O backend assume `model=auto` — o worker escolhe por Calinski–Harabasz.
 * `intent`/`control_files` do payload são ignorados na v1 (JV-04 revisto).
 */
export const requestSuggestions = async (
	experimentId: number,
	payload: SuggestRequestPayload,
): Promise<SuggestionRun> => {
	const res = await CytometryApi.post<AnalysisJob>(`analytics/analysis-jobs/`, {
		experiment: experimentId,
		file_data: payload.file_id,
		gate: payload.parent_id ?? null,
		channels: payload.channels,
		payload: { gate_type: payload.gate_type },
	})
	return jobToRun(res.data)
}

/** Lista os jobs do experimento, filtrando a amostra visível. */
export const fetchSuggestions = async (
	experimentId: number,
	fileId: number,
): Promise<SuggestionRun[]> => {
	const res = await CytometryApi.get<AnalysisJob[]>(
		`analytics/analysis-jobs/`,
		{ params: { experiment: experimentId } },
	)
	return res.data.filter((j) => j.file_id === fileId).map(jobToRun)
}

/**
 * Consolida a candidata em uma gate real da árvore (substituição
 * semântica, FE-42 §4).
 *
 * BE-40, fase posterior — na v1 as candidatas já nascem materializadas,
 * então o card de revisão nunca recebe itens e este caminho fica inerte.
 */
export const acceptSuggestion = async (
	suggestionId: number,
	payload?: AcceptSuggestionPayload,
): Promise<Gate> => {
	const res = await CytometryApi.post<{
		gate: Gate
		suggestion: GateSuggestion
	}>(`suggestions/${suggestionId}/accept/`, payload)
	return res.data.gate
}

/** Descarta a candidata sem criar nada. Idem `acceptSuggestion` — BE-40. */
export const discardSuggestion = async (
	suggestionId: number,
): Promise<void> => {
	await CytometryApi.post(`suggestions/${suggestionId}/discard/`)
}
