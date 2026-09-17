import { useEffect, useRef, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Typography,
} from "@mui/material"
import {
	FaGoogle as GoogleIcon,
	FaMicrosoft as MicrosoftIcon,
} from "react-icons/fa"
import { useAuth } from "../../providers/AuthContext"
import {
	confirmProviderLink,
	type SocialProvider,
} from "../../services/authService"
import { providerLabel } from "../../features/profile/utils/providerLink"

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
	google: <GoogleIcon />,
	microsoft: <MicrosoftIcon />,
}

export default function AuthCallbackPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const { storeToken, refreshUser } = useAuth()
	const [error, setError] = useState("")
	const [confirming, setConfirming] = useState(false)

	// BE-29: o backend encontrou uma conta com o mesmo email — continuar
	// vincula a identidade do IdP a ela; cancelar devolve ao login.
	const linkNotice = searchParams.get("link_notice") === "1"
	const linkProvider = (searchParams.get("provider") ?? "") as SocialProvider
	const linkToken = searchParams.get("token") ?? ""
	const linkEmail = searchParams.get("email") ?? ""

	// Lidos como primitivos: o URLSearchParams do useSearchParams é um
	// objeto novo a cada render — na lista de deps ele refazia o effect
	// em loop, disparava navigate() em rajada e o Chrome travava a
	// navegação ("Throttling navigation"), deixando a tela em
	// "Conectando..." para sempre.
	const access = searchParams.get("access")
	const refresh = searchParams.get("refresh")
	const username = searchParams.get("username")
	const email = searchParams.get("email")
	const userId = searchParams.get("user_id")
	const handled = useRef(false)

	useEffect(() => {
		if (linkNotice || handled.current) return
		handled.current = true

		if (!access || !refresh) {
			setError("Token ausente na URL de callback.")
			return
		}

		storeToken(access, refresh, {
			id: userId ? parseInt(userId, 10) : 0,
			username: username || "",
			email: email || "",
		})
		// Completa o perfil (memberships etc.) — o payload da URL é parcial.
		refreshUser()
		navigate("/", { replace: true })
	}, [
		linkNotice,
		access,
		refresh,
		username,
		email,
		userId,
		storeToken,
		refreshUser,
		navigate,
	])

	const confirmLink = async () => {
		setConfirming(true)
		setError("")
		try {
			const res = await confirmProviderLink(linkProvider, linkToken)
			storeToken(res.access, res.refresh, {
				id: res.user_id,
				username: res.username,
				email: res.email,
			})
			await refreshUser()
			navigate("/", { replace: true })
		} catch {
			setError(
				"Não foi possível confirmar o vínculo — o link pode ter expirado. Refaça o login.",
			)
			setConfirming(false)
		}
	}

	if (linkNotice) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "80vh",
					p: 2,
				}}
			>
				<Card sx={{ maxWidth: 420, width: "100%" }}>
					<CardContent
						sx={{
							p: 3,
							display: "flex",
							flexDirection: "column",
							gap: 2,
							"&:last-child": { pb: 3 },
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1.5,
								fontSize: 28,
								color: "primary.main",
							}}
						>
							{PROVIDER_ICONS[linkProvider]}
							<Typography variant="h6">Conta existente encontrada</Typography>
						</Box>

						<Typography variant="body2" color="text.secondary">
							Já existe uma conta Pandora com o email{" "}
							<strong>{linkEmail}</strong>. Ao continuar, seu login{" "}
							{providerLabel(linkProvider)} será vinculado a ela — os dois
							acessos passam a entrar na mesma conta.
						</Typography>

						{error && <Alert severity="error">{error}</Alert>}

						<Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
							<Button
								variant="outlined"
								fullWidth
								onClick={() => navigate("/login", { replace: true })}
								disabled={confirming}
							>
								Voltar ao login
							</Button>
							<Button
								variant="contained"
								fullWidth
								onClick={confirmLink}
								disabled={confirming}
							>
								{confirming ? "Vinculando…" : "Continuar"}
							</Button>
						</Box>
					</CardContent>
				</Card>
			</Box>
		)
	}

	if (error) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "80vh",
				}}
			>
				<Typography color="error">{error}</Typography>
			</Box>
		)
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "80vh",
				gap: 2,
			}}
		>
			<CircularProgress />
			<Typography>Conectando...</Typography>
		</Box>
	)
}
