import React from "react"
import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Typography,
} from "@mui/material"

interface ExportDialogProps {
	open: boolean
	defaultName: string
	format: "csv" | "xlsx"
	fileName: string
	onFileNameChange: (name: string) => void
	onFormatChange: (format: "csv" | "xlsx") => void
	onExport: () => void
	onClose: () => void
}

const ExportDialog: React.FC<ExportDialogProps> = ({
	open,
	defaultName,
	format,
	fileName,
	onFileNameChange,
	onFormatChange,
	onExport,
	onClose,
}) => (
	<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
		<DialogTitle sx={{ fontSize: "0.95rem", pb: 0.5 }}>
			Exportar Estatísticas
		</DialogTitle>
		<DialogContent>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ mb: 1, display: "block" }}
			>
				Escolha o nome do arquivo e o formato:
			</Typography>
			<TextField
				size="small"
				label="Nome do arquivo"
				value={fileName}
				onChange={(e) => onFileNameChange(e.target.value)}
				sx={{ mb: 1, "& .MuiInputBase-input": { fontSize: "0.85rem" } }}
				fullWidth
				autoFocus
			/>
			<Box sx={{ display: "flex", gap: 1 }}>
				<Chip
					label="CSV"
					variant={format === "csv" ? "filled" : "outlined"}
					color={format === "csv" ? "primary" : "default"}
					onClick={() => onFormatChange("csv")}
				/>
				<Chip
					label="Excel (.xlsx)"
					variant={format === "xlsx" ? "filled" : "outlined"}
					color={format === "xlsx" ? "primary" : "default"}
					onClick={() => onFormatChange("xlsx")}
				/>
			</Box>
		</DialogContent>
		<DialogActions>
			<Button size="small" onClick={onClose}>
				Cancelar
			</Button>
			<Button size="small" variant="contained" onClick={onExport}>
				Exportar
			</Button>
		</DialogActions>
	</Dialog>
)

export default ExportDialog
