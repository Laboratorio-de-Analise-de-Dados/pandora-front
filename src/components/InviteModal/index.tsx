import { useState } from "react"
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material"
import { toast } from "react-toastify"
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
	const [submitted, setSubmitted] = useState(false)
	const [emailSent, setEmailSent] = useState<boolean | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!organizationId) return
		try {
			const res = await CytometryApi.post(`/accounts/organizations/${organizationId}/invites/`, {
				email,
				role,
			})
			setSubmitted(true)
			setEmailSent(res.data.email_sent)
			if (res.data.email_sent) {
				toast.success("Convite enviado por email.", { position: "bottom-right" })
			} else {
				toast.warning("Convite criado, mas o email não foi enviado. Verifique o SMTP.", { position: "bottom-right" })
			}
			if (onInvited) onInvited()
		} catch (err: any) {
			toast.error(err.response?.data?.detail || "Erro ao enviar convite.", { position: "bottom-right" })
		}
	}

	const handleClose = () => {
		setEmail("")
		setRole("member")
		setSubmitted(false)
		setEmailSent(null)
		onClose()
	}

	return (
		<Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
			<DialogTitle>Convidar para {organizationName || "Grupo"}</DialogTitle>
			<DialogContent>
				{submitted ? (
					<Box sx={{ mt: 1 }}>
						<Typography>
							{emailSent
								? "Convite enviado por email. O convidado verá o convite ao fazer login."
								: "Convite criado, mas o email não foi enviado. Verifique a configuração de SMTP."}
						</Typography>
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
						<DialogActions sx={{ px: 0 }}>
							<Button onClick={handleClose}>Cancelar</Button>
							<Button type="submit" variant="contained">Gerar convite</Button>
						</DialogActions>
					</Box>
				)}
			</DialogContent>
			{submitted && (
				<DialogActions>
					<Button onClick={handleClose}>Fechar</Button>
				</DialogActions>
			)}
		</Dialog>
	)
}
