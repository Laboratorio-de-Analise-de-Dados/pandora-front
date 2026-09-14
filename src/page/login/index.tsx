import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
	Box,
	Button,
	Divider,
	TextField,
	Typography,
	Paper,
} from "@mui/material"

import { useAuth } from "../../providers/AuthContext"
import { useAuthProviders } from "../../hooks/useAuthProviders"
import { acceptInvite } from "../../services/inviteService"

export default function LoginPage() {
	const [username, setUsername] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const { login } = useAuth()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const inviteToken = searchParams.get("invite")
	const { providers } = useAuthProviders()

	const apiUrl = import.meta.env.VITE_API_URL || ""

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		try {
			await login(username, password)
			if (inviteToken) {
				try {
					await acceptInvite(inviteToken)
				} catch (err) {
					// ignore accept errors; user is logged in
				}
			}
			navigate("/experiments")
		} catch {
			setError("Usuário ou senha inválidos")
		}
	}

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "80vh",
			}}
		>
			<Paper sx={{ p: 4, width: 360 }}>
				<Typography variant="h5" mb={2}>
					Login
				</Typography>
				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextField
						label="Usuário"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
					<TextField
						label="Senha"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					{error && <Typography color="error">{error}</Typography>}
					<Button type="submit" variant="contained">
						Entrar
					</Button>
					<Button
						component={Link}
						to="/forgot-password"
						variant="text"
						fullWidth
					>
						Esqueci a senha
					</Button>
					<Button
						component={Link}
						to={inviteToken ? `/register?invite=${inviteToken}` : "/register"}
						variant="text"
						fullWidth
					>
						Cadastre-se
					</Button>
					{(providers.google || providers.microsoft) && (
						<>
							<Divider sx={{ my: 1 }}>ou</Divider>
							{providers.google && (
								<Button
									variant="outlined"
									fullWidth
									onClick={() =>
										(window.location.href = `${apiUrl}/accounts/auth/google/`)
									}
								>
									Entrar com Google
								</Button>
							)}
							{providers.microsoft && (
								<Button
									variant="outlined"
									fullWidth
									onClick={() =>
										(window.location.href = `${apiUrl}/accounts/auth/microsoft/`)
									}
								>
									Entrar com Microsoft
								</Button>
							)}
						</>
					)}
				</Box>
			</Paper>
		</Box>
	)
}
