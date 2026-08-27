import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useAuth } from "../../providers/AuthContext"

export default function AuthCallbackPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { storeToken } = useAuth() as any
	const [error, setError] = useState("")

	useEffect(() => {
		const access = searchParams.get("access")
		const refresh = searchParams.get("refresh")
		const username = searchParams.get("username")
		const email = searchParams.get("email")
		const userId = searchParams.get("user_id")

		if (!access || !refresh) {
			setError("Token ausente na URL de callback.")
			return
		}

		if (storeToken) {
			storeToken(access, refresh, { id: userId ? parseInt(userId, 10) : 0, username: username || "", email: email || "" })
		}

		navigate("/", { replace: true })
	}, [navigate, searchParams, storeToken])

	if (error) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
				<Typography color="error">{error}</Typography>
			</Box>
		)
	}

	return (
		<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", gap: 2 }}>
			<CircularProgress />
			<Typography>Conectando...</Typography>
		</Box>
	)
}
