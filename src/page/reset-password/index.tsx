import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import { Box, Button, TextField, Typography, Paper } from "@mui/material"
import { confirmPasswordReset } from "../../services/authService"
import { extractErrorMessage } from "../../utils/apiError"

export default function ResetPasswordPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [error, setError] = useState("")
	const [message, setMessage] = useState("")
	const [loading, setLoading] = useState(false)

	const token = searchParams.get("token")

	useEffect(() => {
		if (!token) {
			setError("Token inválido ou ausente.")
		}
	}, [token])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setMessage("")

		if (newPassword !== confirmPassword) {
			setError("As senhas não coincidem.")
			return
		}

		setLoading(true)
		try {
			await confirmPasswordReset(token!, newPassword)
			setMessage("Senha redefinida com sucesso. Redirecionando para o login...")
			setTimeout(() => navigate("/login"), 2000)
		} catch (err) {
			setError(extractErrorMessage(err) || "Erro ao redefinir senha.")
		} finally {
			setLoading(false)
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
					Nova senha
				</Typography>
				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextField
						label="Nova senha"
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						required
					/>
					<TextField
						label="Confirmar nova senha"
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
					/>
					{error && <Typography color="error">{error}</Typography>}
					{message && <Typography color="success.main">{message}</Typography>}
					<Button
						type="submit"
						variant="contained"
						disabled={loading || !token}
					>
						{loading ? "Salvando..." : "Redefinir senha"}
					</Button>
					<Button component={Link} to="/login" variant="text" fullWidth>
						Voltar para o login
					</Button>
				</Box>
			</Paper>
		</Box>
	)
}
