import { useState } from "react"
import {
	Box,
	Button,
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
				{members.map((member) => (
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
						<ListItemText
							sx={{ flex: "1 1 auto", pr: { sm: 2 }, my: 0 }}
							primary={member.user.username}
							secondary={
								canManage
									? member.user.email
									: `${member.user.email} — ${roleLabel[member.role.name] || member.role.name}`
							}
						/>
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
									{member.user.id === currentUserId ? "Sair" : "Remover"}
								</Button>
							</Box>
						) : null}
					</ListItem>
				))}
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
