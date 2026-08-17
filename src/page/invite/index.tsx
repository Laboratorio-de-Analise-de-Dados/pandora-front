import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Box, Button, Paper, Typography } from "@mui/material"
import CytometryApi from "../../API"
import { useAuth } from "../../providers/AuthContext"

export default function InvitePage() {
	const { token } = useParams<{ token: string }>()
	const navigate = useNavigate()
	const { user, isAuthenticated } = useAuth()
	const [invite, setInvite] = useState<any>(null)
	const [error, setError] = useState("")
	const [accepted, setAccepted] = useState(false)

	useEffect(() => {
		if (!token) return
		CytometryApi.get(`/accounts/invites/${token}/`)
			.then((res) => setInvite(res.data))
			.catch(() => setError("Convite inválido, expirado ou já processado."))
	}, [token])

	const handleAccept = async () => {
		if (!token) return
		try {
			await CytometryApi.post(`/accounts/invites/accept/${token}/`, {})
			setAccepted(true)
			setTimeout(() => navigate("/experiments"), 2000)
		} catch (err: any) {
			const msg = err.response?.data?.detail || err.response?.data?.email || "Erro ao aceitar convite."
			setError(msg)
		}
	}

	if (error) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
				<Paper sx={{ p: 4, width: 400 }}>
					<Typography color="error">{error}</Typography>
				</Paper>
			</Box>
		)
	}

	if (!invite) return null

	const inviteEmail = invite.email || ""
	const userEmail = user?.email || ""
	const isWrongUser = isAuthenticated && userEmail.toLowerCase() !== inviteEmail.toLowerCase()

	return (
		<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
			<Paper sx={{ p: 4, width: 400 }}>
				<Typography variant="h5" mb={2}>
					Convite para {invite.organization?.name || "Grupo"}
				</Typography>
				<Typography mb={2}>
					Você recebeu um convite para participar do grupo <strong>{invite.organization?.name}</strong> como <strong>{invite.role?.name}</strong>.
				</Typography>
				<Typography variant="body2" color="text.secondary" mb={2}>
					Este convite é para o email <strong>{inviteEmail}</strong>. Use esse email para criar sua conta ou fazer login e aceitar.
				</Typography>
				{accepted ? (
					<Typography color="success.main">Convite aceito! Redirecionando...</Typography>
				) : isWrongUser ? (
					<Box>
						<Typography color="error" mb={2}>
							Este convite pertence a <strong>{inviteEmail}</strong>, mas você está logado como <strong>{userEmail}</strong>.
						</Typography>
						<Button variant="contained" fullWidth onClick={() => navigate(`/login?invite=${token}`)}>
							Trocar de conta / Criar conta
						</Button>
					</Box>
				) : isAuthenticated ? (
					<Button variant="contained" fullWidth onClick={handleAccept}>
						Aceitar convite
					</Button>
				) : (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<Button variant="contained" onClick={() => navigate(`/register?invite=${token}`)}>
							Criar conta e aceitar
						</Button>
						<Button variant="outlined" onClick={() => navigate(`/login?invite=${token}`)}>
							Já tenho conta
						</Button>
					</Box>
				)}
			</Paper>
		</Box>
	)
}
