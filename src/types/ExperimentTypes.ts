export interface Experiment {
	id: number
	title: string
	type: string
	values: string[]
	active: boolean
	organization: Organization | null
	created_by: number
}

export type Organization = {
	id: number
	name: string
	org_type: "lab" | "cliente"
}

/**
 * Agrupamento de amostras por diretório do ZIP (BE-07). Opcional até a API
 * expor o campo — ausente/null significa "Sem subsample".
 */
export interface Subsample {
	id: number
	name: string
}

export interface ExperimentFiles {
	id: number
	file_name: string
	gates: Gate[]
	active: boolean
	deactivated_at: string | null
	subsample?: Subsample | null
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
