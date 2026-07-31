import { useState } from "react"
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material"
import { MdContentCopy as CopyIcon } from "react-icons/md"
import CytometryApi from "../../API"

interface InviteModalProps {
	open: boolean
	organizationId: number | null
	organizationName?: string
	onClose: () => void
	onInvited?: () => void
}

export default function InviteModal({ open, organizationId, organizationName, onClose, onInvited }: InviteModalProps) {
	const [email, setEmail] = useState("")
	const [role, setRole] = useState("member")
	const [inviteLink, setInviteLink] = useState<string | null>(null)
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState("")

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		if (!organizationId) return
		try {
			const res = await CytometryApi.post(`/accounts/organizations/${organizationId}/invites/`, {
				email,
				role,
			})
			const token = res.data.token
			setInviteLink(`${window.location.origin}/invite/${token}`)
			if (onInvited) onInvited()
		} catch (err: any) {
			setError(err.response?.data?.detail || "Erro ao enviar convite.")
		}
	}

	const handleClose = () => {
		setEmail("")
		setRole("member")
		setInviteLink(null)
		setCopied(false)
		setError("")
		onClose()
	}

	const copyLink = () => {
		if (!inviteLink) return
		navigator.clipboard.writeText(inviteLink)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
			<DialogTitle>Convidar para {organizationName || "Grupo"}</DialogTitle>
			<DialogContent>
				{inviteLink ? (
					<Box sx={{ mt: 1 }}>
						<Typography mb={1}>
							Convite criado. Como o envio de email pode não estar configurado, copie o link e envie por fora:
						</Typography>
						<TextField
							value={inviteLink}
							fullWidth
							InputProps={{
								readOnly: true,
								endAdornment: (
									<InputAdornment position="end">
										<Button onClick={copyLink} startIcon={<CopyIcon />} size="small">
											{copied ? "Copiado" : "Copiar"}
										</Button>
									</InputAdornment>
								),
							}}
						/>
					</Box>
				) : (
					<Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
						<TextField
							label="Email do convidado"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
						<FormControl>
							<InputLabel>Role</InputLabel>
							<Select value={role} onChange={(e) => setRole(e.target.value)} label="Role">
								<MenuItem value="member">Member</MenuItem>
								<MenuItem value="org_admin">Org Admin</MenuItem>
							</Select>
						</FormControl>
						{error && <Typography color="error">{error}</Typography>}
						<DialogActions sx={{ px: 0 }}>
							<Button onClick={handleClose}>Cancelar</Button>
							<Button type="submit" variant="contained">Gerar convite</Button>
						</DialogActions>
					</Box>
				)}
			</DialogContent>
			{inviteLink && (
				<DialogActions>
					<Button onClick={handleClose}>Fechar</Button>
				</DialogActions>
			)}
		</Dialog>
	)
}
