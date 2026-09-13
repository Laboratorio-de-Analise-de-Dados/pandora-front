import React from "react"
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material"

interface LabelEditDialogProps {
	open: boolean
	allChannels: string[]
	channelLabelMap: Record<string, string>
	editingLabels: Record<string, string>
	onEditingLabelsChange: (labels: Record<string, string>) => void
	onSave: () => void
	onClearAll: () => void
	onClose: () => void
}

const LabelEditDialog: React.FC<LabelEditDialogProps> = ({
	open,
	allChannels,
	channelLabelMap,
	editingLabels,
	onEditingLabelsChange,
	onSave,
	onClearAll,
	onClose,
}) => (
	<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
		<DialogTitle sx={{ fontSize: "0.95rem" }}>
			Editar Labels dos Canais
		</DialogTitle>
		<DialogContent>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ mb: 1, display: "block" }}
			>
				Adicione labels customizados (ex: FITC-A → CFSE). O nome original do
				canal é preservado.
			</Typography>
			<Table size="small">
				<TableHead>
					<TableRow>
						<TableCell
							sx={{ py: 0.5, fontSize: "0.75rem", fontWeight: "bold" }}
						>
							Canal Original
						</TableCell>
						<TableCell
							sx={{ py: 0.5, fontSize: "0.75rem", fontWeight: "bold" }}
						>
							Label Customizado
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{allChannels.map((ch) => (
						<TableRow key={ch}>
							<TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
								{channelLabelMap[ch] ?? ch}
							</TableCell>
							<TableCell sx={{ py: 0.25 }}>
								<TextField
									size="small"
									placeholder={channelLabelMap[ch] ?? ch}
									value={editingLabels[ch] ?? ""}
									onChange={(e) =>
										onEditingLabelsChange({
											...editingLabels,
											[ch]: e.target.value,
										})
									}
									sx={{
										"& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 },
									}}
									fullWidth
								/>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</DialogContent>
		<DialogActions>
			<Button size="small" onClick={onClearAll}>
				Limpar Todos
			</Button>
			<Box sx={{ flex: 1 }} />
			<Button size="small" onClick={onClose}>
				Cancelar
			</Button>
			<Button size="small" variant="contained" onClick={onSave}>
				Salvar
			</Button>
		</DialogActions>
	</Dialog>
)

export default LabelEditDialog
