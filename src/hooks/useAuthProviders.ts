import { useEffect, useState } from "react"
import CytometryApi from "../API"

interface AuthProvidersConfig {
	google: boolean
	microsoft: boolean
}

export function useAuthProviders() {
	const [providers, setProviders] = useState<AuthProvidersConfig>({ google: false, microsoft: false })
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		CytometryApi.get("/accounts/auth/providers/")
			.then((res) => setProviders(res.data))
			.catch(() => setProviders({ google: false, microsoft: false }))
			.finally(() => setLoading(false))
	}, [])

	return { providers, loading }
}
