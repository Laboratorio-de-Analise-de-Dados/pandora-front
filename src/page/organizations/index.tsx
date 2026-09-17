import { useState } from "react"
import { Box, Tab, Tabs, Typography } from "@mui/material"
import { toast } from "react-toastify"
import { useAuth } from "../../providers/AuthContext"
import { useInvites } from "../../hooks/useInvites"
import { useSentInvites } from "../../hooks/useSentInvites"
import { useOrganizations } from "../../hooks/useOrganizations"
import { Organization, RoleName } from "../../services/organizationService"
import type { Invite } from "../../services/inviteService"
import InviteModal from "../../components/InviteModal"
import { extractErrorMessage } from "../../utils/apiError"
import OrgsTab from "./OrgsTab"
import CreateOrgTab from "./CreateOrgTab"
import InvitesTab from "./InvitesTab"

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
	const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
	const [inviteOpen, setInviteOpen] = useState(false)

	const {
		invites: receivedInvites,
		loading: receivedLoading,
		accept,
		decline,
		refresh: refreshReceived,
	} = useInvites(Boolean(user) && tab === 1)

	const {
		invites: sentInvites,
		loading: sentLoading,
		resend,
		cancel,
		refresh: refreshSent,
	} = useSentInvites(Boolean(user) && tab === 1)

	const handleCreateOrg = async (name: string, orgType: string) => {
		await createOrg(name, orgType)
		setTab(0)
		await refreshUser()
	}

	const handleChangeRole = async (
		orgId: number,
		membershipId: number,
		role: RoleName,
	) => {
		try {
			await changeRole(orgId, membershipId, role)
			toast.success("Permissão atualizada.")
			await refreshUser()
		} catch (err: any) {
			toast.error(extractErrorMessage(err) || "Erro ao atualizar a permissão.")
		}
	}

	const handleRemoveMember = async (orgId: number, membershipId: number) => {
		try {
			await removeMembership(orgId, membershipId)
			toast.success("Membro removido.")
			await refreshUser()
		} catch (err: any) {
			toast.error(extractErrorMessage(err) || "Erro ao remover o membro.")
		}
	}

	const openInvite = (org: Organization) => {
		setSelectedOrg(org)
		setInviteOpen(true)
	}

	const handleAccept = async (invite: Invite) => {
		try {
			await accept(invite)
			toast.success("Convite aceito.")
			await refreshUser()
			await loadOrganizations()
			await refreshReceived()
		} catch (err: any) {
			toast.error(extractErrorMessage(err) || "Erro ao aceitar convite.")
		}
	}

	const handleDecline = async (invite: Invite) => {
		try {
			await decline(invite)
			toast.info("Convite recusado.")
			await refreshReceived()
		} catch (err: any) {
			toast.error(extractErrorMessage(err) || "Erro ao recusar convite.")
		}
	}

	const handleResend = async (invite: Invite) => {
		try {
			const emailSent = await resend(invite)
			if (emailSent) {
				toast.success("Convite reenviado por email.")
			} else {
				toast.warning(
					"Convite reenviado, mas o email não foi entregue. Verifique o SMTP.",
				)
			}
		} catch (err: any) {
			toast.error(extractErrorMessage(err) || "Erro ao reenviar convite.")
		}
	}

	const handleCancel = async (invite: Invite) => {
		try {
			await cancel(invite)
			toast.info("Convite cancelado.")
			await refreshSent()
		} catch (err: any) {
			toast.error(extractErrorMessage(err) || "Erro ao cancelar convite.")
		}
	}

	const getRoleName = (m: any) =>
		typeof m.role === "string" ? m.role : m.role?.name

	const isOrgAdmin = (orgId: number) =>
		Boolean(user?.is_super_admin) ||
		Boolean(
			user?.memberships?.some(
				(m) => m.organization?.id === orgId && getRoleName(m) === "org_admin",
			),
		)

	return (
		<Box
			sx={{
				p: { xs: 2, sm: 3, md: 4 },
				maxWidth: { xs: "100%", xl: 1400 },
				mx: "auto",
			}}
		>
			<Typography variant="h4" mb={3}>
				Organizações
			</Typography>

			<Tabs
				value={tab}
				onChange={(_, v) => setTab(v)}
				sx={{ mb: 3 }}
				textColor="primary"
				indicatorColor="primary"
			>
				<Tab label={`Minhas Organizações (${organizations.length})`} />
				<Tab label={`Convites Recebidos (${receivedInvites.length})`} />
				<Tab label="+ Criar Nova" />
			</Tabs>

			<Box>
				{tab === 0 && (
					<OrgsTab
						organizations={organizations}
						user={user}
						isOrgAdmin={isOrgAdmin}
						onInvite={openInvite}
						onChangeRole={handleChangeRole}
						onRemoveMember={handleRemoveMember}
					/>
				)}
				{tab === 1 && (
					<InvitesTab
						receivedInvites={receivedInvites}
						receivedLoading={receivedLoading}
						sentInvites={sentInvites}
						sentLoading={sentLoading}
						userEmail={user?.email}
						onAccept={handleAccept}
						onDecline={handleDecline}
						onResend={handleResend}
						onCancel={handleCancel}
					/>
				)}
				{tab === 2 && <CreateOrgTab onSubmit={handleCreateOrg} />}
			</Box>

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
