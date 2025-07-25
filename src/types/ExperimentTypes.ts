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

export interface Gate {
	id: number
	name: string
	gate_coordinates: object
	dashboard?: object
	children?: Gate[]
}
