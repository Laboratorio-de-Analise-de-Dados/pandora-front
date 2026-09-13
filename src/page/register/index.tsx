import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Box, Button, TextField, Typography, Paper } from "@mui/material"
import { registerUser } from "../../services/authService"
import { fetchInvite } from "../../services/inviteService"
import { extractErrorMessage } from "../../utils/apiError"

export default function RegisterPage() {
	const [searchParams] = useSearchParams()
	const inviteToken = searchParams.get("invite")
	const [form, setForm] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	})
	const [inviteOrg, setInviteOrg] = useState<string | null>(null)
	const [error, setError] = useState("")
	const [success, setSuccess] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		if (inviteToken) {
			fetchInvite(inviteToken)
				.then((invite) => {
					setInviteOrg(invite.organization?.name || "Grupo")
					if (invite.email) {
						setForm((prev) => ({ ...prev, email: invite.email }))
					}
				})
				.catch(() => setError("Convite inválido ou expirado"))
		}
	}, [inviteToken])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		if (form.password !== form.confirmPassword) {
			setError("As senhas não coincidem")
			return
		}
		try {
			await registerUser({
				username: form.username,
				email: form.email,
				password: form.password,
				...(inviteToken ? { invite_token: inviteToken } : {}),
			})
			setSuccess(true)
			setTimeout(() => navigate("/experiments"), 2000)
		} catch (err) {
			setError(extractErrorMessage(err) || "Erro ao criar conta")
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
					Cadastre-se
				</Typography>
				{inviteOrg && (
					<Typography mb={2}>
						Você foi convidado para o grupo <strong>{inviteOrg}</strong>.
					</Typography>
				)}
				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextField
						label="Usuário"
						value={form.username}
						onChange={(e) => setForm({ ...form, username: e.target.value })}
						required
					/>
					<TextField
						label="Email"
						type="email"
						value={form.email}
						onChange={(e) => setForm({ ...form, email: e.target.value })}
						disabled={Boolean(inviteToken)}
						helperText={inviteToken ? "O email é definido pelo convite" : ""}
					/>
					<TextField
						label="Senha"
						type="password"
						value={form.password}
						onChange={(e) => setForm({ ...form, password: e.target.value })}
						required
					/>
					<TextField
						label="Confirmar senha"
						type="password"
						value={form.confirmPassword}
						onChange={(e) =>
							setForm({ ...form, confirmPassword: e.target.value })
						}
						required
					/>
					{error && <Typography color="error">{error}</Typography>}
					{success && (
						<Typography color="success.main">
							Conta criada! Redirecionando...
						</Typography>
					)}
					<Button type="submit" variant="contained">
						Criar conta
					</Button>
					<Button component={Link} to="/login" variant="text" fullWidth>
						Já tem conta? Entrar
					</Button>
				</Box>
			</Paper>
		</Box>
	)
}
