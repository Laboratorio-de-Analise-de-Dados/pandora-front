import {
	Avatar,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	Typography,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { MdLockOutline as LockIcon } from "react-icons/md"
import { useAuth } from "../../providers/AuthContext"
import { ConnectedAccounts } from "../../features/profile"
import Layout from "../../components/Layout"

const providerOptions: Record<
	string,
	{ label: string; color: "success" | "default" | "primary" }
> = {
	local: { label: "Conta local", color: "default" },
	google: { label: "Google", color: "success" },
	microsoft: { label: "Microsoft", color: "primary" },
}

const roleLabels: Record<string, string> = {
	org_admin: "Administrador",
	member: "Membro",
}

const getInitials = (username: string) => {
	const parts = username.split(/[\s._-]+/).filter(Boolean)
	const initials = parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("")
	return initials || "?"
}

const getRoleName = (role: unknown) =>
	typeof role === "string" ? role : (role as { name?: string })?.name

export default function ProfilePage() {
	const { user } = useAuth()
	const navigate = useNavigate()

	const currentProvider = user?.auth_provider || "local"
	const memberships = user?.memberships ?? []

	return (
		<Layout>
			<Box
				sx={{
					// flex:1 — a Box é flex-item do Layout (row); sem isso ela
					// encolhe para a largura do conteúdo. Convenção desktop:
					// conteúdo ancorado no topo-esquerdo (mesmo padrão da tela
					// de Experimentos). Teto de 1200px mantém os dois cards
					// legíveis em ultrawide.
					flex: 1,
					p: { xs: 2, sm: 3, md: 4 },
					maxWidth: { xs: "100%", lg: 1200 },
				}}
			>
				<Typography variant="h4" mb={3}>
					Perfil do Usuário
				</Typography>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
						gap: 3,
						alignItems: "start",
					}}
				>
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
							<Typography
								variant="caption"
								fontWeight="bold"
								color="text.secondary"
							>
								IDENTIDADE DO PESQUISADOR
							</Typography>

							<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
								<Avatar
									sx={{
										width: 56,
										height: 56,
										bgcolor: "primary.main",
										color: "primary.contrastText",
										fontWeight: 700,
										fontSize: "1.25rem",
									}}
								>
									{getInitials(user?.username ?? "")}
								</Avatar>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="h6">{user?.username}</Typography>
									<Typography variant="body2" color="text.secondary" noWrap>
										{user?.email}
									</Typography>
								</Box>
							</Box>

							<Chip
								label={
									providerOptions[currentProvider]?.label || currentProvider
								}
								color={providerOptions[currentProvider]?.color || "default"}
								size="small"
								sx={{ alignSelf: "flex-start" }}
							/>

							<Divider />

							<Box>
								<Typography variant="subtitle2" mb={1}>
									Organizações vinculadas
								</Typography>
								{memberships.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										Nenhuma organização — seus experimentos são pessoais.
									</Typography>
								) : (
									<Box
										component="ul"
										sx={{
											m: 0,
											pl: 2.5,
											display: "flex",
											flexDirection: "column",
											gap: 0.5,
										}}
									>
										{memberships.map((m) => {
											const role = getRoleName(m.role)
											return (
												<Typography component="li" variant="body2" key={m.id}>
													{m.organization.name}{" "}
													<Box
														component="span"
														sx={{ color: "text.secondary" }}
													>
														({roleLabels[role ?? ""] ?? role})
													</Box>
												</Typography>
											)
										})}
									</Box>
								)}
							</Box>

							{currentProvider === "local" && (
								<Button
									variant="outlined"
									startIcon={<LockIcon />}
									onClick={() => navigate("/forgot-password")}
									sx={{ alignSelf: "flex-start" }}
								>
									Alterar senha
								</Button>
							)}
						</CardContent>
					</Card>

					<ConnectedAccounts />
				</Box>
			</Box>
		</Layout>
	)
}
