import React from "react"
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material"
import ColorPicker from "../color-picker"
import type { GateScope } from "../../../../services/gateService"
import type { Gate } from "../../../../types"
import { fmtPct } from "../../../../utils/format"

interface GateEditDialogProps {
	open: boolean
	gate: Gate | null
	name: string
	color: string
	scope: GateScope
	/**
	 * Tamanho da família de cópias (incluindo este gate). O controle de
	 * replicação só aparece quando > 1 — sem cópias, escopo é ruído (FE-23).
	 */
	familySize?: number
	/** Nome do subsample da amostra atual; habilita a opção de escopo. */
	subsampleName?: string
	error: string | null
	saving: boolean
	onNameChange: (name: string) => void
	onColorChange: (color: string) => void
	onScopeChange: (scope: GateScope) => void
	onSave: () => void
	onClose: () => void
}

/**
 * Edição completa do gate (nome + cor + escopo), compartilhada pelo menu de
 * contexto do gráfico e pelo menu da árvore (FE-23/ADR-0013). A replicação é
 * opt-in: desmarcada, a mudança vale só para a amostra (`scope="file"`).
 */
const GateEditDialog: React.FC<GateEditDialogProps> = ({
	open,
	gate,
	name,
	color,
	scope,
	familySize = 0,
	subsampleName,
	error,
	saving,
	onNameChange,
	onColorChange,
	onScopeChange,
	onSave,
	onClose,
}) => {
	const summary = gate?.analysis_result?.analysis_result?.summary_metrics
	const replicate = scope !== "file"
	const scopeTarget =
		scope === "file" ? (subsampleName ? "subsample" : "experiment") : scope

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
				{familySize > 1 && (
					<Box sx={{ mt: 2 }}>
						<FormControlLabel
							control={
								<Checkbox
									size="small"
									checked={replicate}
									onChange={(e) =>
										onScopeChange(
											e.target.checked
												? subsampleName
													? "subsample"
													: "experiment"
												: "file",
										)
									}
								/>
							}
							label={
								<Typography variant="body2">
									Replicar nome e cor para as outras {familySize - 1} amostra(s)
								</Typography>
							}
						/>
						{replicate && (
							<FormControl fullWidth size="small" sx={{ mt: 0.5, pl: 3.5 }}>
								<InputLabel id="gate-scope-label">Aplicar em</InputLabel>
								<Select
									labelId="gate-scope-label"
									label="Aplicar em"
									value={scopeTarget}
									onChange={(e) => onScopeChange(e.target.value as GateScope)}
								>
									{subsampleName && (
										<MenuItem value="subsample">
											Neste subsample ({subsampleName})
										</MenuItem>
									)}
									<MenuItem value="experiment">
										Todas as amostras do experimento
									</MenuItem>
								</Select>
							</FormControl>
						)}
					</Box>
				)}
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
					disabled={saving || !name.trim()}
				>
					Salvar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default GateEditDialog
