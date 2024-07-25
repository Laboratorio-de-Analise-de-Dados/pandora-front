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

interface ExperimentContextProps {
	experiments: any[]
	listExperiments: () => void
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

	useEffect(() => {
		listExperiments()
	}, [listExperiments])

	return (
		<ExperimentContext.Provider value={{ experiments, listExperiments }}>
			{children}
		</ExperimentContext.Provider>
	)
}
