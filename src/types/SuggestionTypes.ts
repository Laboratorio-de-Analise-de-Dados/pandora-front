import type { GateCoordinates } from "./ExperimentTypes"

/**
 * FE-42 / BE-40 — sugestões de população geradas pelo Juvia e revisadas
 * pelo usuário antes de virarem gates comuns.
 *
 * Intenção em vocabulário de domínio — nunca nome de algoritmo na UI.
 */
export type SuggestIntent =
	"separate" | "positive_negative" | "quadrant" | "rare" | "control"

/** Tipo de geometria pedida no run (pré-selecionada pela ferramenta ativa). */
export type SuggestionGateType = "polygon" | "rectangle" | "quadrant"

/**
 * Controle por eixo no modo "limite por controle": canal fluorescente
 * pede controle próprio (FMO/isotípico); FSC×SSC pede controle de
 * população (arquivo de referência do experimento).
 */
export interface SuggestionControlFiles {
	x?: number | null
	y?: number | null
}

export interface SuggestRequestPayload {
	file_id: number
	/** null = população raiz da amostra. */
	parent_id?: number | null
	channels: [string, string]
	intent: SuggestIntent
	gate_type: SuggestionGateType
	control_files?: SuggestionControlFiles
}

/** Stats da candidata calculadas pelo backend antes de virar gate. */
export interface GateSuggestionStats {
	pct_parent?: number
	events?: number
}

/**
 * Uma população candidata dentro de um run. `accepted` ternário:
 * null = pendente · true = aceita (gate materializado) · false =
 * descartada/substituída.
 */
export interface GateSuggestion {
	id: number
	run: number
	gate_coordinates: GateCoordinates
	stats?: GateSuggestionStats | null
	sort_index?: number
	/** Sugestão aninhada do hierárquico aponta para a mãe do mesmo run. */
	parent_candidate?: number | null
	accepted: boolean | null
	/** Gate materializado quando accepted=true. */
	gate?: number | null
}

export type SuggestionRunStatus =
	"pending" | "processing" | "done" | "error" | "quarantine"

/** Uma execução de sugestão — contexto do pedido + candidatas. */
export interface SuggestionRun {
	id: number
	file_data: number
	/** Gate pai (null = população raiz). */
	parent: number | null
	channels: [string, string]
	intent: SuggestIntent
	gate_type: SuggestionGateType
	status: SuggestionRunStatus
	/** Motivo quando o run fecha sem candidatas ("sem separação confiável"). */
	detail?: string | null
	suggestions?: GateSuggestion[]
	created_at?: string
}

export interface SuggestionListResponse {
	runs: SuggestionRun[]
}

export interface AcceptSuggestionPayload {
	/** Nome opcional ("que população é essa?") — label do dataset. */
	name?: string
	color?: string
	/** Geometria revisada pelo usuário — consolida com automatic=false. */
	gate_coordinates?: GateCoordinates
}
