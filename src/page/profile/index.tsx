import { Box, Button, Card, CardContent, Chip, Typography, Paper, Divider } from "@mui/material"
import { useAuth } from "../../providers/AuthContext"
import { useAuthProviders } from "../../hooks/useAuthProviders"
import Layout from "../../components/Layout"

const providerOptions: Record<string, { label: string; color: "success" | "default" | "primary" }> = {
	local: { label: "Conta local", color: "default" },
	google: { label: "Google", color: "success" },
	microsoft: { label: "Microsoft", color: "primary" },
}

export default function ProfilePage() {
	const { user } = useAuth()
	const { providers } = useAuthProviders()
	const apiUrl = import.meta.env.VITE_API_URL || ""

	const currentProvider = user?.auth_provider || "local"

	return (
		<Layout>
			<Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
				<Typography variant="h4" mb={3}>
					Perfil
				</Typography>

				<Paper sx={{ p: 3, mb: 3 }}>
					<Typography variant="h6" mb={1}>
						{user?.username}
					</Typography>
					<Typography color="text.secondary" mb={2}>
						{user?.email}
					</Typography>
					<Chip
						label={providerOptions[currentProvider]?.label || currentProvider}
						color={providerOptions[currentProvider]?.color || "default"}
						size="small"
					/>
				</Paper>

				<Typography variant="h5" mb={2}>
					Conexões
				</Typography>

				{!providers.google && !providers.microsoft ? (
					<Typography variant="body2" color="text.secondary">
						Nenhum provedor SSO configurado no momento.
					</Typography>
				) : (
					<>
						{providers.google && (
							<Card sx={{ mb: 2 }}>
								<CardContent>
									<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<Box>
											<Typography variant="h6">Google</Typography>
											<Typography variant="body2" color="text.secondary">
												{currentProvider === "google"
													? "Sua conta está conectada ao Google."
													: "Conecte sua conta ao Google para entrar sem senha."}
											</Typography>
										</Box>
										{currentProvider === "google" ? (
											<Chip label="Conectado" color="success" />
										) : (
											<Button
												variant="outlined"
												onClick={() => window.location.href = `${apiUrl}/accounts/auth/google/`}
											>
												Conectar
											</Button>
										)}
									</Box>
								</CardContent>
							</Card>
						)}

						{providers.microsoft && (
							<Card sx={{ mb: 2 }}>
								<CardContent>
									<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<Box>
											<Typography variant="h6">Microsoft</Typography>
											<Typography variant="body2" color="text.secondary">
												{currentProvider === "microsoft"
													? "Sua conta está conectada à Microsoft."
													: "Conecte sua conta à Microsoft para entrar sem senha."}
											</Typography>
										</Box>
										{currentProvider === "microsoft" ? (
											<Chip label="Conectado" color="success" />
										) : (
											<Button
												variant="outlined"
												onClick={() => window.location.href = `${apiUrl}/accounts/auth/microsoft/`}
											>
												Conectar
											</Button>
										)}
									</Box>
								</CardContent>
							</Card>
						)}
					</>
				)}
			</Box>
		</Layout>
	)
}
