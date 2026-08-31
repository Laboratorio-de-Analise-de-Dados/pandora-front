import React from "react"
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	FormLabel,
	Radio,
	RadioGroup,
	TextField,
	Typography,
} from "@mui/material"
import ColorPicker from "../../../../../components/color_picker"
import type { GateScope } from "../../../../../services/gateService"
import type { Gate } from "../../../../../types"
import { fmtPct } from "../../../../../utils/format"

interface GateEditDialogProps {
	open: boolean
	gate: Gate | null
	name: string
	color: string
	scope: GateScope
	error: string | null
	saving: boolean
	onNameChange: (name: string) => void
	onColorChange: (color: string) => void
	onScopeChange: (scope: GateScope) => void
	onSave: () => void
	onClose: () => void
}

const GateEditDialog: React.FC<GateEditDialogProps> = ({
	open,
	gate,
	name,
	color,
	scope,
	error,
	saving,
	onNameChange,
	onColorChange,
	onScopeChange,
	onSave,
	onClose,
}) => {
	const summary = gate?.analysis_result?.analysis_result?.summary_metrics

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Editar Gate</DialogTitle>
			<DialogContent sx={{ pt: 2 }}>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}
				<Box
					sx={{
						display: "flex",
						alignItems: { xs: "stretch", sm: "center" },
						flexDirection: { xs: "column", sm: "row" },
						gap: 1,
					}}
				>
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
				<Box sx={{ mt: 2 }}>
					<FormLabel sx={{ fontSize: "0.8rem" }}>
						Aplicar nome e cor em
					</FormLabel>
					<RadioGroup
						value={scope}
						onChange={(_, value: string) =>
							onScopeChange(value as GateScope)
						}
					>
						<FormControlLabel
							value="file"
							control={<Radio size="small" />}
							label="Apenas nesta amostra"
						/>
						<FormControlLabel
							value="experiment"
							control={<Radio size="small" />}
							label="Em todas as amostras do experimento"
						/>
					</RadioGroup>
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
								<strong>% do parent (%P):</strong>{" "}
								{fmtPct(summary.percent_of_parent_population)}
							</Typography>
							<Typography variant="body2">
								<strong>% do total (%T):</strong>{" "}
								{fmtPct(summary.percent_of_total_population)}
							</Typography>
						</Box>
					</Box>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={saving}>
					Cancelar
				</Button>
				<Button
					onClick={onSave}
					variant="contained"
					color="primary"
					disabled={saving}
				>
					Salvar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default GateEditDialog
