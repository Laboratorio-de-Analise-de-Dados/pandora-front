export interface Experiment {
	id: number
	title: string
	type: string
	/** Contexto livre do experimento (opcional, BE-24). */
	description?: string
	values: string[]
	active: boolean
	/** Ciclo de vida do processamento (`new|uploading|processing|done|error`). */
	status?: string
	/** Motivo da falha quando `status === "error"` (BE-31). */
	error_info?: {
		error_message?: string
		attempts?: number
	} | null
	organization: Organization | null
	created_by: number
	/** Username do criador (ListExperimentSerializer); ausente se o back ainda não expõe. */
	created_by_name?: string | null
	// Campos do BE-21 (metadados visuais da listagem) — opcionais; o card
	// renderiza sem eles até o back expor.
	/** Papel do usuário logado no experimento ("dono"/"editor"/"viewer"). */
	my_role?: string | null
	/** Progresso 0–100 durante upload/processamento; null quando n/a. */
	progress?: number | null
	/** Se a API tem preview (histograma baixa-res) disponível para o card. */
	preview_available?: boolean
	/** BE-22: alguma amostra ativa traz matriz de compensação embutida. */
	compensated?: boolean
}

/** Entrada do vocabulário de tipos de experimento (BE-28). `name` é o
 * casing canônico; o dedup no backend é case/whitespace-insensitive. */
export interface ExperimentType {
	id: number
	name: string
}

export type Organization = {
	id: number
	name: string
	org_type: "lab" | "cliente"
}

/**
 * Subsample = agrupamento de amostras por diretório do ZIP (BE-07 do backend).
 * `source_path` é imutável (o que veio no ZIP); `name` é o rótulo editável.
 */
export interface Subsample {
	id: number
	name: string
	source_path: string
	active: boolean
	created_at: string
	/** Só amostras ativas. */
	files_count: number
	/** BE-22/ADR-0019: subsample marcado como controle de compensação. */
	control_type?: "unstained" | "single_stain" | null
	/** Canal fluorescente coberto — obrigatório quando single_stain. */
	control_channel?: string
}

/** BE-34: tag semântica de amostra (vocabulário de sistema, org ou pessoal). */
export interface SampleTag {
	id: number
	name: string
	/** Chave estável das tags de sistema (ex.: "fmo"); null nas de usuário. */
	system_key: string | null
	category: "control" | "general"
	color: string
	scope: "system" | "organization" | "personal"
	organization: number | null
}

export interface ExperimentFiles {
	id: number
	file_name: string
	gates: Gate[]
	active: boolean
	deactivated_at: string | null
	/** FK do subsample — a API serializa como id (null = "Sem subsample"). */
	subsample?: number | null
	/** BE-22: a amostra traz $SPILLOVER/$COMP nos headers FCS. */
	has_embedded_compensation?: boolean
	/** BE-34: tags explícitas da amostra. */
	tags?: SampleTag[]
	/** BE-34: tags herdadas do subsample (virtuais — não editáveis na amostra). */
	inherited_tags?: SampleTag[]
	/** BE-34: system_keys sugeridos pela heurística de filename. */
	suggested_tags?: string[]
}

/** Nó selecionado na árvore/plot: uma amostra ou um gate dentro dela. */
export interface SelectedSource {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
	copiedFromId?: number | null
}

export interface FileData {
	id: number
	file_name: string
	data_set: Record<string, unknown>
	gates: Gate[]
}

export type Scale = "linear" | "biex"

export type PlotMode = "heatmap" | "scatter" | "histogram"

export interface RectGateCoordinates {
	type?: "rectangle"
	x_axis?: string
	y_axis?: string
	startX: number
	startY: number
	endX: number
	endY: number
}

export interface PolygonGateCoordinates {
	type: "polygon"
	x_axis?: string
	y_axis?: string
	vertices: [number, number][]
}

export interface IntervalGateCoordinates {
	type: "interval"
	x_axis: string
	startX: number
	endX: number
}

export interface QuadrantGateCoordinates {
	type: "quadrant"
	quadrant: "Q1" | "Q2" | "Q3" | "Q4"
	x_axis: string
	y_axis: string
	center_x: number
	center_y: number
}

export type GateCoordinates =
	| RectGateCoordinates
	| PolygonGateCoordinates
	| IntervalGateCoordinates
	| QuadrantGateCoordinates

export interface ChannelStat {
	mean_mfi: number
	median_mfi: number
	std_dev: number
	cv: number
}

export interface SummaryMetrics {
	count: number
	percent_of_total_population: number
	percent_of_parent_population: number
}

export interface AnalysisResultData {
	summary_metrics?: SummaryMetrics
	channel_statistics?: Record<string, ChannelStat>
	/**
	 * ADR-0016 (backend): `false` quando o gate referencia canal ausente na
	 * amostra — a linhagem abaixo dele fica cortada e sem métricas.
	 */
	applicable?: boolean
	reason?: string
	missing_channels?: string[]
	blocked_by_gate?: { id: number; name: string }
}

/**
 * Configuração de visualização persistida por estratégia de gate (eixos,
 * escalas, limites, cutoff e modo). Segue o gate entre arquivos, estilo FlowJo.
 */
export interface PlotViewConfig {
	xAxis: string
	yAxis: string
	xScale: Scale
	yScale: Scale
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	cutoff: number
	plotMode: "heatmap" | "scatter" | "histogram"
}

export interface Gate {
	id: number
	name: string
	parent_id: number | null
	gate_coordinates: GateCoordinates
	file_data: number
	children?: Gate[]
	dashboard: number
	copied_from_id?: number | null
	color?: string | null
	/** Nome de exibição do autor; ausente em gates criados antes do registro. */
	created_by_name?: string | null
	created_at?: string
	plot_config?: Partial<PlotViewConfig>
	analysis_result?: {
		analysis_result: AnalysisResultData
	}
}

export interface NewGate {
	id?: number
	name: string
	parent?: number | null
	gate_coordinates: GateCoordinates
	file_data: number
	children?: Gate[]
	dashboard: Dashboard
	plot_config?: Partial<PlotViewConfig>
	analysis_result?: {
		analysis_result: AnalysisResultData
	}
}

export interface DensityResponse {
	mode: "heatmap" | "scatter" | "histogram"
	total_events: number
	x_label: string
	y_label: string
	// heatmap mode
	// bins com contagem <= cutoff vêm como null (transparentes no Plotly)
	histogram?: (number | null)[][]
	x_edges?: number[]
	y_edges?: number[]
	cutoff?: number
	// scatter mode
	x?: number[]
	y?: number[]
	sampled_events?: number
	// histogram mode (1D)
	counts?: number[]
	edges?: number[]
	// escala aplicada para exibicao (valores ja transformados quando "biex")
	x_scale?: Scale
	y_scale?: Scale
	cofactor?: number
}

export interface DashboardConfig {
	x_axis_label: string
	y_axis_label: string
}

export interface Dashboard {
	name: string
	file_data: number
	dashboard_config: DashboardConfig
}
