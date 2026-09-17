import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Paper,
	Typography,
} from "@mui/material"
import type { Invite } from "../../services/inviteService"

interface InvitesTabProps {
	receivedInvites: Invite[]
	receivedLoading: boolean
	sentInvites: Invite[]
	sentLoading: boolean
	userEmail?: string
	onAccept: (invite: Invite) => void
	onDecline: (invite: Invite) => void
	onResend: (invite: Invite) => void
	onCancel: (invite: Invite) => void
}

const sectionTitleSx = {
	color: "text.secondary",
	textTransform: "uppercase",
	letterSpacing: "0.05em",
} as const

const inviteRowSx = {
	display: "flex",
	flexDirection: { xs: "column", sm: "row" },
	alignItems: { xs: "flex-start", sm: "center" },
	justifyContent: "space-between",
	gap: 1,
	py: 1.5,
	borderTop: "1px solid",
	borderColor: "divider",
} as const

export default function InvitesTab({
	receivedInvites,
	receivedLoading,
	sentInvites,
	sentLoading,
	userEmail,
	onAccept,
	onDecline,
	onResend,
	onCancel,
}: InvitesTabProps) {
	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
				gap: 3,
				alignItems: "start",
			}}
		>
			<Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
				<Typography variant="caption" sx={sectionTitleSx}>
					Convites recebidos
				</Typography>
				{receivedLoading ? (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							mt: 2,
						}}
					>
						<CircularProgress size={20} />
						<Typography variant="body2" color="text.secondary">
							Carregando...
						</Typography>
					</Box>
				) : receivedInvites.length === 0 ? (
					<Typography variant="body2" color="text.secondary" mt={2}>
						Nenhum convite pendente.
					</Typography>
				) : (
					receivedInvites.map((invite) => {
						const emailMatch =
							userEmail?.toLowerCase() === invite.email.toLowerCase()
						return (
							<Box key={invite.id} sx={inviteRowSx}>
								<Box sx={{ minWidth: 0 }}>
									<Typography variant="body2" fontWeight={600} noWrap>
										{invite.organization.name}
									</Typography>
									<Typography variant="body2" color="text.secondary" noWrap>
										{invite.email} — {invite.role.name}
									</Typography>
								</Box>
								<Box
									sx={{
										display: "flex",
										gap: 1,
										flexWrap: "wrap",
										flexShrink: 0,
									}}
								>
									{!emailMatch && (
										<Chip label="Outro email" size="small" color="warning" />
									)}
									<Button
										variant="contained"
										size="small"
										disabled={!emailMatch}
										onClick={() => onAccept(invite)}
									>
										Aceitar
									</Button>
									<Button
										variant="outlined"
										size="small"
										disabled={!emailMatch}
										onClick={() => onDecline(invite)}
									>
										Recusar
									</Button>
								</Box>
							</Box>
						)
					})
				)}
			</Paper>

			<Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
				<Typography variant="caption" sx={sectionTitleSx}>
					Convites enviados
				</Typography>
				{sentLoading ? (
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
							mt: 2,
						}}
					>
						<CircularProgress size={20} />
						<Typography variant="body2" color="text.secondary">
							Carregando...
						</Typography>
					</Box>
				) : sentInvites.length === 0 ? (
					<Typography variant="body2" color="text.secondary" mt={2}>
						Nenhum convite pendente enviado.
					</Typography>
				) : (
					sentInvites.map((invite) => (
						<Box key={invite.id} sx={inviteRowSx}>
							<Box sx={{ minWidth: 0 }}>
								<Typography variant="body2" fontWeight={600} noWrap>
									{invite.organization.name}
								</Typography>
								<Typography variant="body2" color="text.secondary" noWrap>
									{invite.email} — {invite.role.name}
								</Typography>
							</Box>
							<Box
								sx={{
									display: "flex",
									gap: 1,
									flexWrap: "wrap",
									flexShrink: 0,
								}}
							>
								<Button
									variant="outlined"
									size="small"
									onClick={() => onResend(invite)}
								>
									Reenviar
								</Button>
								<Button
									variant="outlined"
									color="error"
									size="small"
									onClick={() => onCancel(invite)}
								>
									Cancelar
								</Button>
							</Box>
						</Box>
					))
				)}
			</Paper>
		</Box>
	)
}
