import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from "@mui/material"
import type { Experiment } from "../../../types"

const STATUS_LABELS: Record<string, string> = {
	new: "Novo",
	uploading: "Enviando",
	processing: "Processando",
	done: "Concluído",
	error: "Erro",
}

interface ExperimentDetailsDialogProps {
	open: boolean
	experiment: Experiment
	/** Quando definido, mostra o botão "Editar" no rodapé. */
	onEdit?: () => void
	onClose: () => void
}

/** FE-24: detalhes do experimento a partir do card — só leitura, sem fetch. */
export default function ExperimentDetailsDialog({
	open,
	experiment,
	onEdit,
	onClose,
}: ExperimentDetailsDialogProps) {
	const status = experiment.status
		? (STATUS_LABELS[experiment.status] ?? experiment.status)
		: null

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle sx={{ pb: 1 }}>
				{experiment.title}
				{status && (
					<Chip
						size="small"
						variant="outlined"
						color={experiment.status === "error" ? "error" : "default"}
						label={status}
						sx={{ ml: 1 }}
					/>
				)}
			</DialogTitle>
			<DialogContent>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					<Typography variant="body2">
						<strong>Tipo:</strong> {experiment.type}
					</Typography>
					<Typography variant="body2">
						<strong>Criado por:</strong> {experiment.created_by_name ?? "—"}
					</Typography>
					<Typography variant="body2">
						<strong>Organização:</strong>{" "}
						{experiment.organization?.name ?? "Pessoal"}
					</Typography>
					<Box>
						<Typography variant="body2" sx={{ mb: 0.5 }}>
							<strong>Marcadores:</strong>
						</Typography>
						{experiment.values?.length ? (
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
								{experiment.values.map((value) => (
									<Chip
										key={value}
										size="small"
										variant="outlined"
										label={value}
									/>
								))}
							</Box>
						) : (
							<Typography variant="body2" color="text.secondary">
								Nenhum marcador declarado.
							</Typography>
						)}
					</Box>
					{!experiment.active && (
						<Alert severity="warning" sx={{ mt: 0.5 }}>
							Este experimento está desativado.
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Fechar</Button>
				{onEdit && (
					<Button variant="contained" onClick={onEdit}>
						Editar
					</Button>
				)}
			</DialogActions>
		</Dialog>
	)
}
