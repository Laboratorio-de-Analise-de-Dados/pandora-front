import { useEffect, useState } from "react"
import {
	AuthProvidersConfig,
	fetchAuthProviders,
} from "../services/authService"

export function useAuthProviders() {
	const [providers, setProviders] = useState<AuthProvidersConfig>({
		google: false,
		microsoft: false,
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchAuthProviders()
			.then(setProviders)
			.catch(() => setProviders({ google: false, microsoft: false }))
			.finally(() => setLoading(false))
	}, [])

	return { providers, loading }
}
