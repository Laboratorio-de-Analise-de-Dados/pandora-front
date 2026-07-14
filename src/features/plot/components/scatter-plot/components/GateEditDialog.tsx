import React from "react"
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Typography,
} from "@mui/material"
import ColorPicker from "../../../../../components/color_picker"
import type { Gate } from "../../../../../types"

interface GateEditDialogProps {
	open: boolean
	gate: Gate | null
	name: string
	color: string
	onNameChange: (name: string) => void
	onColorChange: (color: string) => void
	onSave: () => void
	onClose: () => void
}

const GateEditDialog: React.FC<GateEditDialogProps> = ({
	open,
	gate,
	name,
	color,
	onNameChange,
	onColorChange,
	onSave,
	onClose,
}) => {
	const summary = gate?.analysis_result?.analysis_result?.summary_metrics

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Editar Gate</DialogTitle>
			<DialogContent sx={{ pt: 2 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<ColorPicker value={color} onChange={onColorChange} />
					<TextField
						fullWidth
						label="Nome do Gate"
						value={name}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onNameChange(e.target.value)
						}
						placeholder="Digite o novo nome"
						autoFocus
					/>
				</Box>
				{summary && (
					<Box
						sx={{ mt: 2, p: 1.5, bgcolor: "background.paper", borderRadius: 1 }}
					>
						<Typography variant="caption" color="text.secondary">
							Estatísticas:
						</Typography>
						<Box
							sx={{
								mt: 1,
								display: "flex",
								flexDirection: "column",
								gap: "0.5rem",
							}}
						>
							<Typography variant="body2">
								<strong>Eventos:</strong> {summary.count.toLocaleString()}
							</Typography>
							<Typography variant="body2">
								<strong>% do total:</strong>{" "}
								{summary.percent_of_total_population.toFixed(1)}%
							</Typography>
							<Typography variant="body2">
								<strong>% do pai:</strong>{" "}
								{summary.percent_of_parent_population.toFixed(1)}%
							</Typography>
						</Box>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button onClick={onSave} variant="contained" color="primary">
					Salvar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default GateEditDialog
