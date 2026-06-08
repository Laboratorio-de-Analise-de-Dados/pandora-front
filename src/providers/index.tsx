import { ExperimentProvider } from "./ExperimentContext"
import { SelectionProvider } from "./SelectionContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React, { ReactNode } from "react"

interface ProvidersProps {
	children: ReactNode
}

// Cache do cliente: respostas de density/stats vivem enquanto o experimento
// está aberto (staleTime) e são descartadas pouco depois de não usadas (gcTime).
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000,
			gcTime: 30 * 60 * 1000,
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
})

const Providers: React.FC<ProvidersProps> = ({ children }) => {
	return (
		<QueryClientProvider client={queryClient}>
			<ExperimentProvider>
				<SelectionProvider>{children}</SelectionProvider>
			</ExperimentProvider>
		</QueryClientProvider>
	)
}

export default Providers
