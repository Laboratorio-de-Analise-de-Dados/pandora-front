import React, {
	createContext,
	useContext,
	FC,
	ReactNode,
	useState,
} from "react"

interface SelectionContextProps {
	selections: Record<string, number[]>
	addSelectedId: (selectionName: string, id: number) => void
	clearSelection: (selectionName: string) => void
	clearAllSelections: () => void
}

const SelectionContext = createContext<SelectionContextProps | undefined>(
	undefined
)

export const useSelectionContext = (): SelectionContextProps => {
	const context = useContext(SelectionContext)
	if (!context) {
		throw new Error(
			"useSelectionContext must be used within a SelectionProvider"
		)
	}
	return context
}

interface SelectionProviderProps {
	children: ReactNode
}

export const SelectionProvider: FC<SelectionProviderProps> = ({ children }) => {
	const [selections, setSelections] = useState<Record<string, number[]>>({})

	const addSelectedId = (selectionName: string, id: number) => {
		setSelections((prevSelections) => ({
			...prevSelections,
			[selectionName]: [...(prevSelections[selectionName] || []), id],
		}))
	}

	const clearSelection = (selectionName: string) => {
		setSelections((prevSelections) => ({
			...prevSelections,
			[selectionName]: [],
		}))
	}

	const clearAllSelections = () => {
		setSelections({})
	}

	return (
		<SelectionContext.Provider
			value={{ selections, addSelectedId, clearSelection, clearAllSelections }}
		>
			{children}
		</SelectionContext.Provider>
	)
}
