import React, {
	createContext,
	useContext,
	FC,
	ReactNode,
	useState,
	useEffect,
	useCallback,
} from "react"
import CytometryApi from "../../API"
import { AxiosResponse } from "axios"

interface ExperimentContextProps {
	experiments: any[]
	listExperiments: () => void
	createExperiment: (
		title: string,
		type: string,
		file: File
	) => Promise<AxiosResponse<any, any>>
}

const ExperimentContext = createContext<ExperimentContextProps | undefined>(
	undefined
)

export const useExperimentsContext = (): ExperimentContextProps => {
	const context = useContext(ExperimentContext)
	if (!context) {
		throw new Error(
			"useExperimentsContext must be used within a SelectionProvider"
		)
	}
	return context
}

interface ExperimentProviderProps {
	children: ReactNode
}

export const ExperimentProvider: FC<ExperimentProviderProps> = ({
	children,
}) => {
	const [experiments, setExperiments] = useState<any[]>([])
	const listExperiments = useCallback(async function ListExperiments() {
		const experiments = await CytometryApi.get("/experiment")
		setExperiments([...experiments.data])
	}, [])

	const createExperiment = async (title: string, type: string, file: File) => {
		const formData = new FormData()

		formData.append("file", file)
		formData.append("title", title)
		formData.append("type", type)

		const fetchNewExperiment = await CytometryApi.post("/experiment/", formData)
		await listExperiments()
		return fetchNewExperiment
	}

	useEffect(() => {
		listExperiments()
	}, [listExperiments])

	return (
		<ExperimentContext.Provider
			value={{ experiments, listExperiments, createExperiment }}
		>
			{children}
		</ExperimentContext.Provider>
	)
}
