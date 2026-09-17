import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Snackbar,
	TextField,
	Typography,
} from "@mui/material"
import {
	FaGoogle as GoogleIcon,
	FaMicrosoft as MicrosoftIcon,
} from "react-icons/fa"
import { MdOutlinePerson as PersonIcon } from "react-icons/md"
import { useAuth } from "../../../providers/AuthContext"
import { useAuthProviders } from "../../../hooks/useAuthProviders"
import {
	confirmMerge,
	startProviderLink,
	unlinkSocialAccount,
	type SocialAccount,
	type SocialProvider,
	type UnlinkPayload,
} from "../../../services/authService"
import {
	SOCIAL_ACCOUNTS_QUERY_KEY,
	useSocialAccounts,
} from "../hooks/useSocialAccounts"
import {
	linkFeedbackFromParams,
	mergeNoticeFromParams,
	providerLabel,
	type LinkFeedback,
	type MergeNotice,
} from "../utils/providerLink"

const PROVIDER_ICONS: Record<SocialProvider, React.ReactNode> = {
	google: <GoogleIcon />,
	microsoft: <MicrosoftIcon />,
}

const PROVIDER_DESCRIPTIONS: Record<SocialProvider, string> = {
	google: "Entrar com sua conta Google",
	microsoft: "Entrar com sua conta Microsoft",
}

interface ProviderRowProps {
	icon: React.ReactNode
	name: string
	description: string
	action: React.ReactNode
}

function ProviderRow({ icon, name, description, action }: ProviderRowProps) {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 2,
				p: 1.5,
				border: "1px solid",
				borderColor: "divider",
				borderRadius: 2,
			}}
		>
			<Box
				sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}
			>
				<Box sx={{ display: "flex", fontSize: 20, color: "primary.main" }}>
					{icon}
				</Box>
				<Box sx={{ minWidth: 0 }}>
					<Typography variant="body2" fontWeight={600}>
						{name}
					</Typography>
					<Typography variant="caption" color="text.secondary" noWrap>
						{description}
					</Typography>
				</Box>
			</Box>
			{action}
		</Box>
	)
}

/** Seção "Contas conectadas" do perfil (FE-31 / BE-29): lista vínculos de
 * IdP, inicia o fluxo de link via endpoint autenticado e desvincula com a
 * regra do último método de acesso. */
export default function ConnectedAccounts() {
	const { user, refreshUser } = useAuth()
	const { providers } = useAuthProviders()
	const { data: accounts = [], isLoading } = useSocialAccounts()
	const queryClient = useQueryClient()
	const [searchParams, setSearchParams] = useSearchParams()

	const [feedback, setFeedback] = useState<LinkFeedback | null>(null)
	const [linking, setLinking] = useState<SocialProvider | null>(null)
	const [target, setTarget] = useState<SocialAccount | null>(null)
	const [mergeNotice, setMergeNotice] = useState<MergeNotice | null>(null)
	const [merging, setMerging] = useState(false)
	const [needsCredential, setNeedsCredential] = useState(false)
	const [dialogError, setDialogError] = useState("")
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [wantsReset, setWantsReset] = useState(false)

	// Feedback do redirect do backend (?linked= / ?link_error= /
	// ?merge_notice=) — executa uma vez no mount e limpa os params da URL.
	useEffect(() => {
		const merge = mergeNoticeFromParams(searchParams)
		if (merge) {
			setMergeNotice(merge)
		}
		const fb = linkFeedbackFromParams(searchParams)
		if (fb) {
			setFeedback(fb)
		}
		if (!merge && !fb) return
		searchParams.delete("linked")
		searchParams.delete("link_error")
		searchParams.delete("merge_notice")
		searchParams.delete("provider")
		searchParams.delete("email")
		searchParams.delete("token")
		setSearchParams(searchParams, { replace: true })
		queryClient.invalidateQueries({ queryKey: SOCIAL_ACCOUNTS_QUERY_KEY })
		refreshUser()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const connect = async (provider: SocialProvider) => {
		setLinking(provider)
		try {
			const url = await startProviderLink(provider)
			window.location.href = url
		} catch {
			setLinking(null)
			setFeedback({
				severity: "error",
				message: "Não foi possível iniciar a conexão. Tente novamente.",
			})
		}
	}

	const unlink = useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: UnlinkPayload }) =>
			unlinkSocialAccount(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SOCIAL_ACCOUNTS_QUERY_KEY })
			closeDialog()
			setFeedback({ severity: "success", message: "Conta desconectada." })
			refreshUser()
		},
		onError: (err) => {
			if (
				axios.isAxiosError(err) &&
				err.response?.data?.requires_credential_setup
			) {
				// Último método de acesso: o backend exige senha nova ou reset
				setNeedsCredential(true)
				setEmail(user?.email ?? "")
				setDialogError("")
				return
			}
			const detail = axios.isAxiosError(err)
				? err.response?.data?.detail
				: undefined
			setDialogError(detail ?? "Erro ao desconectar. Tente novamente.")
		},
	})

	const closeDialog = () => {
		setTarget(null)
		setNeedsCredential(false)
		setDialogError("")
		setEmail("")
		setPassword("")
		setWantsReset(false)
	}

	const confirmMergeNow = async () => {
		if (!mergeNotice) return
		setMerging(true)
		try {
			await confirmMerge(mergeNotice.token)
			setMergeNotice(null)
			setFeedback({
				severity: "success",
				message: `Conta ${mergeNotice.email} fundida na sua.`,
			})
			queryClient.invalidateQueries({ queryKey: SOCIAL_ACCOUNTS_QUERY_KEY })
			refreshUser()
		} catch {
			setMergeNotice(null)
			setFeedback({
				severity: "error",
				message:
					"Não foi possível fundir as contas — a confirmação pode ter expirado. Refaça a conexão.",
			})
		} finally {
			setMerging(false)
		}
	}

	const confirmUnlink = () => {
		if (!target) return
		const payload: UnlinkPayload = needsCredential
			? wantsReset
				? { email: email || undefined, request_password_reset: true }
				: { email: email || undefined, password }
			: {}
		unlink.mutate({ id: target.id, payload })
	}

	const linkedByProvider = new Map(accounts.map((a) => [a.provider, a]))
	const availableProviders = (
		["google", "microsoft"] as SocialProvider[]
	).filter((p) => providers[p])
	const isLocal = user?.auth_provider === "local"

	return (
		<Card>
			<CardContent
				sx={{
					p: 3,
					display: "flex",
					flexDirection: "column",
					gap: 2,
					"&:last-child": { pb: 3 },
				}}
			>
				<Typography variant="caption" fontWeight="bold" color="text.secondary">
					CONTAS CONECTADAS
				</Typography>

				<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
					<ProviderRow
						icon={<PersonIcon />}
						name="Conta local"
						description="Login com usuário e senha"
						action={
							isLocal ? (
								<Chip label="Ativa" color="primary" size="small" />
							) : (
								<Chip label="Disponível" variant="outlined" size="small" />
							)
						}
					/>

					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
							<CircularProgress size={22} />
						</Box>
					) : (
						availableProviders.map((provider) => {
							const linked = linkedByProvider.get(provider)
							return (
								<ProviderRow
									key={provider}
									icon={PROVIDER_ICONS[provider]}
									name={providerLabel(provider)}
									description={
										linked ? linked.email : PROVIDER_DESCRIPTIONS[provider]
									}
									action={
										linked ? (
											<Button
												variant="outlined"
												size="small"
												color="error"
												onClick={() => setTarget(linked)}
											>
												Desconectar
											</Button>
										) : (
											<Button
												variant="outlined"
												size="small"
												disabled={linking === provider}
												onClick={() => connect(provider)}
											>
												{linking === provider ? "Redirecionando…" : "Conectar"}
											</Button>
										)
									}
								/>
							)
						})
					)}

					{!isLoading && availableProviders.length === 0 && (
						<Typography variant="body2" color="text.secondary">
							Nenhum provedor SSO configurado no momento.
						</Typography>
					)}
				</Box>
			</CardContent>

			<Dialog open={Boolean(target)} onClose={closeDialog} fullWidth>
				<DialogTitle>
					Desconectar {target ? providerLabel(target.provider) : ""}
				</DialogTitle>
				<DialogContent
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<Typography variant="body2">
						Sua conta e todo o histórico são preservados — apenas o login via{" "}
						{target ? providerLabel(target.provider) : ""} deixa de funcionar.
					</Typography>

					{needsCredential && (
						<>
							<Alert severity="warning">
								Este é o último método de acesso da conta. Defina uma senha ou
								receba um link de redefinição para não perder o acesso.
							</Alert>
							<TextField
								label="Email da conta"
								type="email"
								size="small"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
							{!wantsReset && (
								<TextField
									label="Nova senha"
									type="password"
									size="small"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							)}
							<FormControlLabel
								control={
									<Checkbox
										checked={wantsReset}
										onChange={(e) => setWantsReset(e.target.checked)}
									/>
								}
								label="Prefiro receber um link de redefinição por email"
							/>
						</>
					)}

					{dialogError && <Alert severity="error">{dialogError}</Alert>}
				</DialogContent>
				<DialogActions>
					<Button onClick={closeDialog}>Cancelar</Button>
					<Button
						variant="contained"
						color="error"
						disabled={
							unlink.isPending ||
							(needsCredential && !wantsReset && password.length < 6)
						}
						onClick={confirmUnlink}
					>
						{unlink.isPending ? "Desconectando…" : "Desconectar"}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={Boolean(mergeNotice)}
				onClose={() => setMergeNotice(null)}
				fullWidth
			>
				<DialogTitle>Fundir contas</DialogTitle>
				<DialogContent
					sx={{ display: "flex", flexDirection: "column", gap: 2 }}
				>
					<Typography variant="body2">
						A identidade {providerLabel(mergeNotice?.provider ?? "")} que você
						conectou já pertence a outra conta Pandora
						{mergeNotice?.email ? (
							<>
								{" "}
								(<strong>{mergeNotice.email}</strong>)
							</>
						) : (
							""
						)}
						. Ao fundir, todos os dados dela (experimentos, organizações,
						histórico) passam para a sua conta atual e a outra é desativada.
						Essa ação não pode ser desfeita.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setMergeNotice(null)} disabled={merging}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={confirmMergeNow}
						disabled={merging}
					>
						{merging ? "Fundindo…" : "Fundir contas"}
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={Boolean(feedback)}
				autoHideDuration={6000}
				onClose={() => setFeedback(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={() => setFeedback(null)}
					severity={feedback?.severity ?? "info"}
					variant="filled"
				>
					{feedback?.message}
				</Alert>
			</Snackbar>
		</Card>
	)
}
