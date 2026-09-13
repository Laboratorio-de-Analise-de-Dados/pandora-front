import { useState } from "react"
import { Link } from "react-router-dom"
import { Box, Button, TextField, Typography, Paper } from "@mui/material"
import { toast } from "react-toastify"
import { requestPasswordReset } from "../../services/authService"

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		try {
			await requestPasswordReset(email)
			toast.success(
				"Se o email estiver cadastrado, você receberá um link de recuperação.",
			)
		} catch {
			toast.error("Erro ao solicitar recuperação. Tente novamente.")
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
					Recuperar senha
				</Typography>
				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>

					<Button type="submit" variant="contained" disabled={loading}>
						{loading ? "Enviando..." : "Enviar link"}
					</Button>
					<Button component={Link} to="/login" variant="text" fullWidth>
						Voltar para o login
					</Button>
				</Box>
			</Paper>
		</Box>
	)
}
