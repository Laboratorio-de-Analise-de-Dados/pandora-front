import { useEffect, useState } from "react"
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Typography,
} from "@mui/material"

interface CheckpointDialogProps {
	open: boolean
	/** Renomear checkpoint existente; senão, criação. */
	initialMessage?: string
	/** Contexto do ponto (ex.: "estado atual" ou "revisão #42"). */
	targetLabel: string
	saving?: boolean
	onClose: () => void
	onConfirm: (message: string) => void
}

/**
 * "Salvar ponto" / pin / renomear checkpoint — um campo de mensagem
 * opcional (vazio = "Checkpoint <data/hora>" automático).
 */
export default function CheckpointDialog({
	open,
	initialMessage = "",
	targetLabel,
	saving,
	onClose,
	onConfirm,
}: CheckpointDialogProps) {
	const [message, setMessage] = useState(initialMessage)

	useEffect(() => {
		if (open) setMessage(initialMessage)
	}, [open, initialMessage])

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle>Marcar ponto no histórico</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					O ponto ficará fixado em {targetLabel}. Você pode restaurar o
					experimento até ele depois.
				</Typography>
				<TextField
					autoFocus
					fullWidth
					size="small"
					label="Nome do ponto (opcional)"
					placeholder='Ex.: "Antes do reprocessamento"'
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					inputProps={{ maxLength: 200 }}
				/>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} disabled={saving}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={() => onConfirm(message.trim())}
					disabled={saving}
				>
					Salvar ponto
				</Button>
			</DialogActions>
		</Dialog>
	)
}
