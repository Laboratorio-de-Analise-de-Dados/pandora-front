import { useState } from "react"
import {
	Box,
	Button,
	TextField,
	Typography,
	Paper,
	List,
	ListItem,
	ListItemText,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Tabs,
	Tab,
	Chip,
	CircularProgress,
	Divider,
} from "@mui/material"
import { toast } from "react-toastify"
import { useAuth } from "../../providers/AuthContext"
import { useInvites } from "../../hooks/useInvites"
import { useSentInvites } from "../../hooks/useSentInvites"
import { useOrganizations } from "../../hooks/useOrganizations"
import { Organization, RoleName } from "../../services/organizationService"
import InviteModal from "../../components/InviteModal"
import OrganizationMembers from "../../components/OrganizationMembers"

export default function OrganizationsPage() {
	const { user, refreshUser } = useAuth()
	const {
		organizations,
		refresh: loadOrganizations,
		create: createOrg,
		changeRole,
		remove: removeMembership,
	} = useOrganizations()
	const [tab, setTab] = useState(0)
	const [newOrgName, setNewOrgName] = useState("")
	const [newOrgType, setNewOrgType] = useState("lab")
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
	const [inviteOpen, setInviteOpen] = useState(false)

	const {
		invites: receivedInvites,
		loading: receivedLoading,
		accept,
		decline,
		refresh: refreshReceived,
	} = useInvites(Boolean(user) && tab === 2)

	const {
		invites: sentInvites,
		loading: sentLoading,
		resend,
		cancel,
		refresh: refreshSent,
	} = useSentInvites(Boolean(user) && tab === 2)

	const handleCreateOrg = async (e: React.FormEvent) => {
		e.preventDefault()
		await createOrg(newOrgName, newOrgType)
		setNewOrgName("")
		setTab(0)
		await refreshUser()
	}

	const handleChangeRole = async (orgId: number, membershipId: number, role: RoleName) => {
		try {
			await changeRole(orgId, membershipId, role)
			toast.success("Permissão atualizada.", { position: "bottom-right" })
			await refreshUser()
		} catch (err: any) {
			toast.error(
				err.response?.data?.role?.[0] ||
					err.response?.data?.detail ||
					"Erro ao atualizar a permissão.",
				{ position: "bottom-right" },
			)
		}
	}

	const handleRemoveMember = async (orgId: number, membershipId: number) => {
		try {
			await removeMembership(orgId, membershipId)
			toast.success("Membro removido.", { position: "bottom-right" })
			await refreshUser()
		} catch (err: any) {
			toast.error(
				err.response?.data?.role?.[0] ||
					err.response?.data?.detail ||
					"Erro ao remover o membro.",
				{ position: "bottom-right" },
			)
		}
	}

	const openInvite = (org: Organization) => {
		setSelectedOrg(org)
		setInviteOpen(true)
	}

	const handleAccept = async (invite: any) => {
		try {
			await accept(invite)
			toast.success("Convite aceito.", { position: "bottom-right" })
			await refreshUser()
			await loadOrganizations()
			await refreshReceived()
		} catch (err: any) {
			toast.error(err.response?.data?.detail || "Erro ao aceitar convite.", { position: "bottom-right" })
		}
	}

	const handleDecline = async (invite: any) => {
		try {
			await decline(invite)
			toast.info("Convite recusado.", { position: "bottom-right" })
			await refreshReceived()
		} catch (err: any) {
			toast.error(err.response?.data?.detail || "Erro ao recusar convite.", { position: "bottom-right" })
		}
	}

	const handleResend = async (invite: any) => {
		try {
			const emailSent = await resend(invite)
			if (emailSent) {
				toast.success("Convite reenviado por email.", { position: "bottom-right" })
			} else {
				toast.warning("Convite reenviado, mas o email não foi entregue. Verifique o SMTP.", { position: "bottom-right" })
			}
		} catch (err: any) {
			toast.error(err.response?.data?.detail || "Erro ao reenviar convite.", { position: "bottom-right" })
		}
	}

	const handleCancel = async (invite: any) => {
		try {
			await cancel(invite)
			toast.info("Convite cancelado.", { position: "bottom-right" })
			await refreshSent()
		} catch (err: any) {
			toast.error(err.response?.data?.detail || "Erro ao cancelar convite.", { position: "bottom-right" })
		}
	}

	const getRoleName = (m: any) =>
		typeof m.role === "string" ? m.role : m.role?.name

	const isOrgAdmin = (orgId: number) =>
		Boolean(user?.is_super_admin) ||
		user?.memberships?.some((m) => m.organization?.id === orgId && getRoleName(m) === "org_admin")

	return (
		<Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: { xs: "100%", md: 1200 }, mx: "auto" }}>
			<Typography variant="h4" mb={3}>
				Organizações
			</Typography>

			<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
				<Tab label="Meus grupos" />
				<Tab label="Criar grupo" />
				<Tab label="Convites" />
			</Tabs>

			<Paper sx={{ p: { xs: 2, md: 3 }, minHeight: 360 }}>
				{tab === 0 && (
					<Box>
						{organizations.map((org) => (
							<Paper key={org.id} variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: { xs: "flex-start", sm: "center" },
										flexDirection: { xs: "column", sm: "row" },
										gap: 1,
									}}
								>
									<Box>
										<Typography variant="subtitle1" fontWeight={500}>
											{org.name}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{org.org_type} — {org.members?.length || 0} membros
										</Typography>
									</Box>
									{isOrgAdmin(org.id) && (
										<Button
											variant="outlined"
											size="small"
											onClick={() => openInvite(org)}
											sx={{ mt: { xs: 1, sm: 0 } }}
										>
											Convidar
										</Button>
									)}
								</Box>
								<OrganizationMembers
									members={org.members || []}
									canManage={Boolean(isOrgAdmin(org.id))}
									currentUserId={user?.id}
									onChangeRole={(membershipId, role) =>
										handleChangeRole(org.id, membershipId, role)
									}
									onRemove={(membershipId) => handleRemoveMember(org.id, membershipId)}
								/>
								</Paper>
							))}
							{organizations.length === 0 && (
								<Typography color="text.secondary" mt={2}>
									Nenhuma organização encontrada.
								</Typography>
							)}
						</Box>
					)}

				{tab === 1 && (
					<Box component="form" onSubmit={handleCreateOrg} sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 500 }}>
						<TextField
							label="Nome da organização"
							value={newOrgName}
							onChange={(e) => setNewOrgName(e.target.value)}
							required
						/>
						<FormControl>
							<InputLabel>Tipo</InputLabel>
							<Select value={newOrgType} onChange={(e) => setNewOrgType(e.target.value)} label="Tipo">
								<MenuItem value="lab">Laboratório</MenuItem>
								<MenuItem value="customer">Cliente</MenuItem>
							</Select>
						</FormControl>
						<Button type="submit" variant="contained" sx={{ mt: 1 }}>
							Criar organização
						</Button>
					</Box>
				)}

				{tab === 2 && (
					<Box>
						<Typography variant="h6" gutterBottom>
							Convites recebidos
						</Typography>
						{receivedLoading ? (
							<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
								<CircularProgress size={20} />
								<Typography variant="body2" color="text.secondary">Carregando...</Typography>
							</Box>
						) : receivedInvites.length === 0 ? (
							<Typography color="text.secondary" mb={3}>
								Nenhum convite pendente.
							</Typography>
						) : (
							<List dense sx={{ mb: 4 }}>
								{receivedInvites.map((invite) => {
									const emailMatch = user?.email.toLowerCase() === invite.email.toLowerCase()
									return (
										<ListItem
											key={invite.id}
											divider
											sx={{ flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}
										>
											<ListItemText
												primary={`Convite para ${invite.organization.name}`}
												secondary={`${invite.email} — ${invite.role.name}`}
											/>
											<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
												{!emailMatch && (
													<Chip label="Outro email" size="small" color="warning" />
												)}
												<Button
													variant="contained"
													size="small"
													disabled={!emailMatch}
													onClick={() => handleAccept(invite)}
												>
													Aceitar
												</Button>
												<Button
													variant="outlined"
													size="small"
													disabled={!emailMatch}
													onClick={() => handleDecline(invite)}
												>
													Recusar
												</Button>
											</Box>
										</ListItem>
									)
								})}
							</List>
						)}

						<Divider sx={{ my: 2 }} />

						<Typography variant="h6" gutterBottom>
							Convites enviados
						</Typography>
						{sentLoading ? (
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<CircularProgress size={20} />
								<Typography variant="body2" color="text.secondary">Carregando...</Typography>
							</Box>
						) : sentInvites.length === 0 ? (
							<Typography color="text.secondary">
								Nenhum convite pendente enviado.
							</Typography>
						) : (
							<List dense>
								{sentInvites.map((invite) => (
									<ListItem
										key={invite.id}
										divider
										sx={{ flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, gap: 1 }}
									>
										<ListItemText
											primary={`${invite.organization.name}`}
											secondary={`${invite.email} — ${invite.role.name}`}
										/>
										<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
											<Button
												variant="outlined"
												size="small"
												onClick={() => handleResend(invite)}
											>
												Reenviar
											</Button>
											<Button
												variant="outlined"
												color="error"
												size="small"
												onClick={() => handleCancel(invite)}
											>
												Cancelar
											</Button>
										</Box>
									</ListItem>
								))}
							</List>
						)}
					</Box>
				)}
			</Paper>

			<InviteModal
				open={inviteOpen}
				organizationId={selectedOrg?.id || null}
				organizationName={selectedOrg?.name}
				onClose={() => setInviteOpen(false)}
				onInvited={loadOrganizations}
			/>
		</Box>
	)
}
