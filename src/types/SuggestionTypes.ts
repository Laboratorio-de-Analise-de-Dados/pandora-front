import type { GateCoordinates } from "./ExperimentTypes"

/**
 * FE-42 / BE-40 — sugestões de população geradas pelo Juvia e revisadas
 * pelo usuário antes de virarem gates comuns.
 *
 * Intenção em vocabulário de domínio — nunca nome de algoritmo na UI.
 */
export type SuggestIntent =
	"separate" | "positive_negative" | "quadrant" | "rare" | "control"

/** Tipo de geometria pedida no run (pré-selecionada pela ferramenta ativa).
 * `interval` é o caso 1D do histograma (FE-45/JV-06). */
export type SuggestionGateType =
	"polygon" | "rectangle" | "quadrant" | "interval"

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
	/** 2 canais no scatter; 1 no histograma (interval, FE-45). */
	channels: string[]
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
	/** 2 canais no scatter; 1 no run de histograma (interval). */
	channels: string[]
	intent: SuggestIntent
	gate_type: SuggestionGateType
	status: SuggestionRunStatus
	/** Motivo quando o run fecha sem candidatas ("sem separação confiável"). */
	detail?: string | null
	suggestions?: GateSuggestion[]
	created_at?: string
}

/** Payload do worker gravado em `job.result.worker_result` (BE-27). */
export interface AnalysisJobWorkerResult {
	gates?: { name: string; gate_coordinates: GateCoordinates }[]
	candidates?: {
		name: string
		gate_coordinates: GateCoordinates
		stats?: GateSuggestionStats | null
	}[]
	/** Motivo da resposta honesta ("sem separação confiável"). */
	reason?: string
	model?: string
	gate_type?: SuggestionGateType
	metrics?: Record<string, number | null>
	n_total?: number
}

/** Artefatos materializados pelo `complete` (BE-27 `result`). */
export interface AnalysisJobResult {
	worker_result?: AnalysisJobWorkerResult
	created_gate_ids?: number[]
	revision_id?: number
	checkpoint_id?: number
}

/**
 * Job da fila BE-27 (`GET/POST /analytics/analysis-jobs/`) — o contrato
 * real da v1 (JV-04 revisto): gates nascem materializados, sem candidatas
 * pendentes. Os endpoints `suggestions/` do BE-40 são fase posterior.
 */
export interface AnalysisJob {
	id: number
	experiment: number
	file_id: number
	subsample_id?: number | null
	gate_id?: number | null
	operation: string
	model: string
	channels: string[]
	status: SuggestionRunStatus
	attempts?: number
	last_error?: string | null
	result?: AnalysisJobResult | null
	created_gate_ids?: number[]
	created_at?: string
}

export interface AcceptSuggestionPayload {
	/** Nome opcional ("que população é essa?") — label do dataset. */
	name?: string
	color?: string
	/** Geometria revisada pelo usuário — consolida com automatic=false. */
	gate_coordinates?: GateCoordinates
}
