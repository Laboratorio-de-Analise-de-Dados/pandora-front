export interface Experiment {
	id: number
	title: string
	type: string
	values: string[]
	active: boolean
}

export interface ExperimentFiles {
	id: number
	file_name: string
	gates: Gate[]
}

export interface FileData {
	id: number
	file_name: string
	data_set: any
	gates: Gate[]
}

export type Scale = "linear" | "biex"

export interface RectGateCoordinates {
	type?: "rectangle"
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

export interface Gate {
	id: number
	name: string
	parent_id: number | null
	gate_coordinates: GateCoordinates
	file_data: number
	children?: Gate[]
	dashboard: number
	analysis_result?: {
		analysis_result: {
			summary_metrics?: {
				count: number
				percent_of_total_population: number
				percent_of_parent_population: number
			}
		}
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
	analysis_result?: {
		analysis_result: {
			summary_metrics?: {
				count: number
				percent_of_total_population: number
				percent_of_parent_population: number
			}
		}
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
