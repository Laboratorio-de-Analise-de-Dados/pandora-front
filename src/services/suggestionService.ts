import CytometryApi from "../API"
import type {
	AcceptSuggestionPayload,
	Gate,
	GateSuggestion,
	SuggestRequestPayload,
	SuggestionListResponse,
	SuggestionRun,
} from "../types"

/**
 * BE-40 — pedidos de sugestão de população (Juvia). O POST cria o
 * SuggestionRun + job pendente na fila (BE-27); o GET devolve runs
 * recentes com candidatas pendentes — é o polling do front enquanto o
 * job roda e a fonte das candidatas que sobrevivem a navegação.
 */
export const requestSuggestions = async (
	experimentId: number,
	payload: SuggestRequestPayload,
): Promise<SuggestionRun> => {
	const res = await CytometryApi.post<SuggestionRun>(
		`experiment/${experimentId}/suggestions/`,
		payload,
	)
	return res.data
}

export const fetchSuggestions = async (
	experimentId: number,
	fileId: number,
): Promise<SuggestionRun[]> => {
	const res = await CytometryApi.get<SuggestionListResponse>(
		`experiment/${experimentId}/suggestions/`,
		{ params: { file: fileId } },
	)
	return res.data.runs
}

/**
 * Materializa a candidata como gate normal (parent = run.parent, mesma
 * amostra). `gate_coordinates` revisadas fazem o back marcar
 * `automatic=false`; sem elas nasce `automatic=true`. Cria checkpoint
 * `source=juvia` no histórico.
 */
export const acceptSuggestion = async (
	suggestionId: number,
	payload: AcceptSuggestionPayload = {},
): Promise<Gate> => {
	const res = await CytometryApi.post<Gate>(
		`suggestions/${suggestionId}/accept/`,
		payload,
	)
	return res.data
}

/** Marca `accepted=false` — sinal negativo do dataset de outcomes. */
export const discardSuggestion = async (
	suggestionId: number,
): Promise<GateSuggestion> => {
	const res = await CytometryApi.post<GateSuggestion>(
		`suggestions/${suggestionId}/discard/`,
	)
	return res.data
}
