import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Box, Button, Paper, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { acceptInvite, fetchInvite } from "../../services/inviteService"
import { startProviderLink } from "../../services/authService"
import { extractErrorMessage } from "../../utils/apiError"
import { useAuth } from "../../providers/AuthContext"
import { useConfirm } from "../../components/ConfirmDialog"

export default function InvitePage() {
	const { token } = useParams<{ token: string }>()
	const navigate = useNavigate()
	const { user, isAuthenticated } = useAuth()
	const confirm = useConfirm()
	const [error, setError] = useState("")
	const [accepted, setAccepted] = useState(false)

	const { data: invite, isError: inviteFailed } = useQuery({
		queryKey: ["invite", token],
		queryFn: () => fetchInvite(token as string),
		enabled: !!token,
		retry: false,
	})

	const handleAccept = async () => {
		if (!token) return
		try {
			await acceptInvite(token)
			setAccepted(true)
			setTimeout(() => navigate("/experiments"), 2000)
		} catch (err) {
			setError(extractErrorMessage(err) || "Erro ao aceitar convite.")
		}
	}

	// BE-41: o token do convite é a prova de posse — email divergente não
	// bloqueia, mas pede confirmação explícita antes de criar o acesso na
	// conta logada.
	const handleAcceptDivergent = async () => {
		const ok = await confirm({
			title: "Aceitar convite com esta conta?",
			description: `Este convite foi enviado para ${inviteEmail}. O acesso ao grupo será criado na conta ${userEmail}.`,
			confirmLabel: "Aceitar com esta conta",
		})
		if (ok) await handleAccept()
	}

	// CTA de vínculo vai pro modo link autenticado (não pro login SSO) —
	// o email institucional vira SocialAccount da conta existente, sem
	// criar usuário fantasma nem depender de merge.
	const handleLinkMicrosoft = async () => {
		try {
			const authorizeUrl = await startProviderLink("microsoft")
			window.location.href = authorizeUrl
		} catch {
			setError("Não foi possível iniciar o vínculo com a Microsoft.")
		}
	}

	if (inviteFailed || error) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "80vh",
				}}
			>
				<Paper sx={{ p: 4, width: 400 }}>
					<Typography color="error">
						{error || "Convite inválido, expirado ou já processado."}
					</Typography>
				</Paper>
			</Box>
		)
	}

	if (!invite) return null

	const inviteEmail = invite.email || ""
	const userEmail = user?.email || ""
	const isDivergent =
		isAuthenticated && userEmail.toLowerCase() !== inviteEmail.toLowerCase()

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				minHeight: "80vh",
			}}
		>
			<Paper sx={{ p: 4, width: 400 }}>
				<Typography variant="h5" mb={2}>
					Convite para {invite.organization?.name || "Grupo"}
				</Typography>
				<Typography mb={2}>
					Você recebeu um convite para participar do grupo{" "}
					<strong>{invite.organization?.name}</strong> como{" "}
					<strong>{invite.role?.name}</strong>.
				</Typography>
				<Typography variant="body2" color="text.secondary" mb={2}>
					Este convite é para o email <strong>{inviteEmail}</strong>. Use esse
					email para criar sua conta ou fazer login e aceitar.
				</Typography>
				{accepted ? (
					<Typography color="success.main">
						Convite aceito! Redirecionando...
					</Typography>
				) : isDivergent ? (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
						<Typography variant="body2" color="warning.dark">
							Você está logado como <strong>{userEmail}</strong> — diferente do
							email convidado. O acesso ao grupo será criado nesta conta.
						</Typography>
						<Button
							variant="contained"
							fullWidth
							onClick={handleAcceptDivergent}
						>
							Aceitar com esta conta
						</Button>
						<Button variant="outlined" fullWidth onClick={handleLinkMicrosoft}>
							Vincular email institucional (Microsoft)
						</Button>
						<Button
							variant="text"
							fullWidth
							onClick={() => navigate(`/login?invite=${token}`)}
						>
							Trocar de conta / Criar conta
						</Button>
					</Box>
				) : isAuthenticated ? (
					<Button variant="contained" fullWidth onClick={handleAccept}>
						Aceitar convite
					</Button>
				) : (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
						<Button
							variant="contained"
							onClick={() => navigate(`/register?invite=${token}`)}
						>
							Criar conta e aceitar
						</Button>
						<Button
							variant="outlined"
							onClick={() => navigate(`/login?invite=${token}`)}
						>
							Já tenho conta
						</Button>
					</Box>
				)}
			</Paper>
		</Box>
	)
}
