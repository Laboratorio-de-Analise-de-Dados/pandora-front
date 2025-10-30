import { ExperimentProvider } from "./ExperimentContext"
import { SelectionProvider } from "./SelectionContext"
import React, { ReactNode } from "react"

interface ProvidersProps {
	children: ReactNode
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
	return (
		<ExperimentProvider>
			<SelectionProvider>{children}</SelectionProvider>
		</ExperimentProvider>
	)
}

export default Providers
