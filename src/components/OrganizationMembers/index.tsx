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

// Grade tabular compartilhada entre cabeçalho e linhas (só sm+; no xs a
// linha empilha em coluna única — mobile-first).
const rowGrid = {
	xs: "1fr",
	sm: "minmax(160px,1.2fr) minmax(200px,1.4fr) minmax(140px,170px) 96px",
} as const

const headerCellSx = {
	color: "text.secondary",
	textTransform: "uppercase",
	letterSpacing: "0.05em",
} as const

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
			<Box sx={{ mt: 2 }}>
				<Box
					sx={{
						display: { xs: "none", sm: "grid" },
						gridTemplateColumns: rowGrid,
						gap: 2,
						px: 1.5,
						pb: 1,
					}}
				>
					<Typography variant="caption" sx={headerCellSx}>
						Membro
					</Typography>
					<Typography variant="caption" sx={headerCellSx}>
						E-mail
					</Typography>
					<Typography variant="caption" sx={headerCellSx}>
						Papel
					</Typography>
					<Typography
						variant="caption"
						sx={{ ...headerCellSx, textAlign: "right" }}
					>
						Ações
					</Typography>
				</Box>
				{members.map((member) => {
					const isYou = member.user.id === currentUserId
					return (
						<Box
							key={member.id}
							sx={{
								display: "grid",
								gridTemplateColumns: rowGrid,
								alignItems: "center",
								gap: { xs: 1, sm: 2 },
								px: 1.5,
								py: 1.5,
								borderTop: "1px solid",
								borderColor: "divider",
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
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
								<Typography variant="body2" noWrap>
									{member.user.username}
									{isYou ? " (Você)" : ""}
								</Typography>
							</Box>
							<Typography
								variant="body2"
								color="text.secondary"
								noWrap
								sx={{ minWidth: 0 }}
							>
								{member.user.email}
							</Typography>
							{canManage ? (
								<Select
									size="small"
									value={member.role.name}
									onChange={(e) =>
										onChangeRole(member.id, e.target.value as RoleName)
									}
									sx={{ width: "100%" }}
								>
									<MenuItem value="member">Membro</MenuItem>
									<MenuItem value="org_admin">Administrador</MenuItem>
								</Select>
							) : (
								<Chip
									label={roleLabel[member.role.name] || member.role.name}
									size="small"
									variant="outlined"
									sx={{ height: 22, fontSize: "0.7rem", justifySelf: "start" }}
								/>
							)}
							{canManage && (
								<Button
									variant="outlined"
									color="error"
									size="small"
									onClick={() => setPending(member)}
									sx={{ justifySelf: { sm: "end" } }}
								>
									{isYou ? "Sair" : "Remover"}
								</Button>
							)}
						</Box>
					)
				})}
			</Box>

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
