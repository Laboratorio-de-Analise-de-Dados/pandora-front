import { ExperimentProvider } from "./ExperimentContext"
import { AuthProvider } from "./AuthContext"
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
			<AuthProvider>
				<ExperimentProvider>{children}</ExperimentProvider>
			</AuthProvider>
		</QueryClientProvider>
	)
}

export default Providers
