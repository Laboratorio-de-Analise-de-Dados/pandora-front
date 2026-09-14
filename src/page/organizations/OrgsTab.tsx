import { Box, Button, Paper, Typography } from "@mui/material"
import type { Organization, RoleName } from "../../services/organizationService"
import OrganizationMembers from "../../components/OrganizationMembers"
import type { AuthUser } from "../../providers/AuthContext"

interface OrgsTabProps {
	organizations: Organization[]
	user: AuthUser | null
	isOrgAdmin: (orgId: number) => boolean
	onInvite: (org: Organization) => void
	onChangeRole: (
		orgId: number,
		membershipId: number,
		role: RoleName,
	) => Promise<void>
	onRemoveMember: (orgId: number, membershipId: number) => Promise<void>
}

export default function OrgsTab({
	organizations,
	user,
	isOrgAdmin,
	onInvite,
	onChangeRole,
	onRemoveMember,
}: OrgsTabProps) {
	return (
		<Box>
			{organizations.map((org) => (
				<Paper
					key={org.id}
					variant="outlined"
					sx={{ p: { xs: 1.5, md: 2 }, mb: 2 }}
				>
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
								onClick={() => onInvite(org)}
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
							onChangeRole(org.id, membershipId, role)
						}
						onRemove={(membershipId) => onRemoveMember(org.id, membershipId)}
					/>
				</Paper>
			))}
			{organizations.length === 0 && (
				<Typography color="text.secondary" mt={2}>
					Nenhuma organização encontrada.
				</Typography>
			)}
		</Box>
	)
}
