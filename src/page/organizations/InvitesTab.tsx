import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	List,
	ListItem,
	ListItemText,
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
		<Box>
			<Typography variant="h6" gutterBottom>
				Convites recebidos
			</Typography>
			{receivedLoading ? (
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
					<CircularProgress size={20} />
					<Typography variant="body2" color="text.secondary">
						Carregando...
					</Typography>
				</Box>
			) : receivedInvites.length === 0 ? (
				<Typography color="text.secondary" mb={3}>
					Nenhum convite pendente.
				</Typography>
			) : (
				<List dense sx={{ mb: 4 }}>
					{receivedInvites.map((invite) => {
						const emailMatch =
							userEmail?.toLowerCase() === invite.email.toLowerCase()
						return (
							<ListItem
								key={invite.id}
								divider
								sx={{
									flexDirection: { xs: "column", sm: "row" },
									alignItems: { xs: "flex-start", sm: "center" },
									gap: 1,
								}}
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
					<Typography variant="body2" color="text.secondary">
						Carregando...
					</Typography>
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
							sx={{
								flexDirection: { xs: "column", sm: "row" },
								alignItems: { xs: "flex-start", sm: "center" },
								gap: 1,
							}}
						>
							<ListItemText
								primary={`${invite.organization.name}`}
								secondary={`${invite.email} — ${invite.role.name}`}
							/>
							<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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
						</ListItem>
					))}
				</List>
			)}
		</Box>
	)
}
