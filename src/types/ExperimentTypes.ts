export interface Experiment {
  id:number
  title: string
  type: string
  values: string[]
  active: boolean
}

export interface ExperimentFiles {
  id:number
  file_name:string
}

export interface FileData {
  id: number
  file_name: string
  data_set:any
}