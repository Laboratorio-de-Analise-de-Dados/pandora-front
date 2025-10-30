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

export interface GateCoordinates {
	startX: number
	startY: number
	endX: number
	endY: number
}

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
	parent?: number
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

export interface DashboardConfig {
	x_axis_label: string
	y_axis_label: string
}

export interface Dashboard {
	name: string
	file_data: number
	dashboard_config: DashboardConfig
}
