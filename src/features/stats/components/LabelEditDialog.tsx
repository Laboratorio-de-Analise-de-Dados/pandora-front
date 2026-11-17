import React from "react"
import {
	Box,
	Button,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material"
import { AppDialog } from "../../../components/AppDialog"

interface LabelEditDialogProps {
	open: boolean
	/** Título custom (ex.: "Renomear FL11-A" no rename por eixo, FE-51). */
	title?: string
	allChannels: string[]
	channelLabelMap: Record<string, string>
	/** FE-51: canal pré-focado ao abrir via clique na tabela de stats. */
	focusChannel?: string | null
	editingLabels: Record<string, string>
	onEditingLabelsChange: (labels: Record<string, string>) => void
	onSave: () => void
	onClearAll: () => void
	onClose: () => void
}

const LabelEditDialog: React.FC<LabelEditDialogProps> = ({
	open,
	title = "Editar Labels dos Canais",
	allChannels,
	channelLabelMap,
	focusChannel,
	editingLabels,
	onEditingLabelsChange,
	onSave,
	onClearAll,
	onClose,
}) => (
	<AppDialog
		open={open}
		title={title}
		onClose={onClose}
		maxWidth="sm"
		actions={
			<>
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
			</>
		}
	>
		<Typography
			variant="caption"
			color="text.secondary"
			sx={{ mb: 1, display: "block" }}
		>
			Adicione labels customizados (ex: FITC-A → CFSE). O nome original do canal
			é preservado.
		</Typography>
		<Table size="small">
			<TableHead>
				<TableRow>
					<TableCell sx={{ py: 0.5, fontSize: "0.75rem", fontWeight: "bold" }}>
						Canal Original
					</TableCell>
					<TableCell sx={{ py: 0.5, fontSize: "0.75rem", fontWeight: "bold" }}>
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
								autoFocus={ch === focusChannel}
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
	</AppDialog>
)

export default LabelEditDialog
