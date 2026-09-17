import { useState } from "react"
import {
	Avatar,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	List,
	ListItem,
	ListItemText,
	MenuItem,
	Select,
	Typography,
} from "@mui/material"
import { Member, RoleName } from "../../services/organizationService"

interface OrganizationMembersProps {
	members: Member[]
	canManage: boolean
	currentUserId?: number
	onChangeRole: (membershipId: number, role: RoleName) => Promise<void>
	onRemove: (membershipId: number) => Promise<void>
}

const roleLabel: Record<string, string> = {
	org_admin: "Administrador",
	member: "Membro",
}

export default function OrganizationMembers({
	members,
	canManage,
	currentUserId,
	onChangeRole,
	onRemove,
}: OrganizationMembersProps) {
	const [pending, setPending] = useState<Member | null>(null)

	if (members.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary" mt={1}>
				Nenhum membro ativo.
			</Typography>
		)
	}

	return (
		<>
			<List dense sx={{ mt: 1 }}>
				{/* Cabeçalho da tabela de membros (mockup FE-26). */}
				<ListItem
					sx={{
						justifyContent: "space-between",
						px: 0,
						py: 0.5,
					}}
				>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
						}}
					>
						Membro
					</Typography>
					<Typography
						variant="caption"
						sx={{
							color: "text.secondary",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
						}}
					>
						Role
					</Typography>
				</ListItem>
				{members.map((member) => {
					const isYou = member.user.id === currentUserId
					return (
						<ListItem
							key={member.id}
							divider
							sx={{
								flexDirection: { xs: "column", sm: "row" },
								alignItems: { xs: "flex-start", sm: "center" },
								justifyContent: "space-between",
								gap: 1,
								px: 0,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									flex: "1 1 auto",
									pr: { sm: 2 },
									minWidth: 0,
								}}
							>
								<Avatar
									sx={{
										width: 28,
										height: 28,
										fontSize: "0.75rem",
										bgcolor: "primary.main",
										color: "primary.contrastText",
									}}
								>
									{member.user.username.charAt(0).toUpperCase()}
								</Avatar>
								<ListItemText
									sx={{ my: 0, minWidth: 0 }}
									primary={`${member.user.username}${isYou ? " (Você)" : ""}`}
									secondary={member.user.email}
									primaryTypographyProps={{ noWrap: true }}
									secondaryTypographyProps={{ noWrap: true }}
								/>
							</Box>
							{canManage ? (
								<Box
									sx={{
										display: "flex",
										gap: 1,
										flexWrap: "wrap",
										alignItems: "center",
										justifyContent: { sm: "flex-end" },
										flex: { sm: "0 0 auto" },
										width: { xs: "100%", sm: "auto" },
									}}
								>
									<Select
										size="small"
										value={member.role.name}
										onChange={(e) =>
											onChangeRole(member.id, e.target.value as RoleName)
										}
										sx={{ minWidth: { xs: "100%", sm: 160 } }}
									>
										<MenuItem value="member">Membro</MenuItem>
										<MenuItem value="org_admin">Administrador</MenuItem>
									</Select>
									<Button
										variant="outlined"
										color="error"
										size="small"
										onClick={() => setPending(member)}
									>
										{isYou ? "Sair" : "Remover"}
									</Button>
								</Box>
							) : (
								<Chip
									label={roleLabel[member.role.name] || member.role.name}
									size="small"
									variant="outlined"
									sx={{ height: 22, fontSize: "0.7rem" }}
								/>
							)}
						</ListItem>
					)
				})}
			</List>

			<Dialog
				open={Boolean(pending)}
				onClose={() => setPending(null)}
				fullWidth
				maxWidth="xs"
				PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
			>
				<DialogTitle>Remover membro</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{pending?.user.id === currentUserId
							? "Você perderá o acesso aos experimentos deste grupo. Continuar?"
							: `Remover ${pending?.user.username} do grupo? Ele perde o acesso aos experimentos do grupo.`}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setPending(null)}>Cancelar</Button>
					<Button
						color="error"
						variant="contained"
						onClick={async () => {
							const member = pending
							setPending(null)
							if (member) await onRemove(member.id)
						}}
					>
						Remover
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}
