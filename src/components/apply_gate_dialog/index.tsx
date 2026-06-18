import {
	Box,
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Typography,
} from "@mui/material"
import React, { useState } from "react"
import { ExperimentFiles } from "../../types"

interface ApplyGateDialogProps {
	open: boolean
	gateName: string
	gateId: number
	files: ExperimentFiles[]
	sourceFileDataId: number
	onClose: () => void
	onApply: (targetFileDataIds: number[], recursive: boolean) => void
	loading?: boolean
}

export default function ApplyGateDialog({
	open,
	gateName,
	gateId,
	files,
	sourceFileDataId,
	onClose,
	onApply,
	loading,
}: ApplyGateDialogProps) {
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
	const [recursive, setRecursive] = useState(true)

	const targetFiles = files.filter((f) => f.id !== sourceFileDataId)

	const handleToggle = (fileId: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(fileId)) next.delete(fileId)
			else next.add(fileId)
			return next
		})
	}

	const handleSelectAll = () => {
		if (selectedIds.size === targetFiles.length) {
			setSelectedIds(new Set())
		} else {
			setSelectedIds(new Set(targetFiles.map((f) => f.id)))
		}
	}

	const handleApply = () => {
		onApply(Array.from(selectedIds), recursive)
		setSelectedIds(new Set())
	}

	const handleClose = () => {
		setSelectedIds(new Set())
		onClose()
	}

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Aplicar gate em outros arquivos</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 1 }}>
					Copiar <strong>{gateName}</strong> para os arquivos selecionados.
					Os gates copiados são independentes — editar no destino não afeta a origem.
				</Typography>

				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={selectedIds.size === targetFiles.length && targetFiles.length > 0}
								indeterminate={selectedIds.size > 0 && selectedIds.size < targetFiles.length}
								onChange={handleSelectAll}
								size="small"
							/>
						}
						label={<Typography variant="body2">Selecionar todos</Typography>}
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={recursive}
								onChange={(e) => setRecursive(e.target.checked)}
								size="small"
							/>
						}
						label={<Typography variant="body2">Incluir sub-gates</Typography>}
					/>
				</Box>

				<List dense sx={{ maxHeight: 250, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1 }}>
					{targetFiles.map((file) => (
						<ListItem key={file.id} disablePadding>
							<ListItemButton onClick={() => handleToggle(file.id)} dense>
								<ListItemIcon sx={{ minWidth: 36 }}>
									<Checkbox
										edge="start"
										checked={selectedIds.has(file.id)}
										size="small"
									/>
								</ListItemIcon>
								<ListItemText primary={`📄 ${file.file_name}`} />
							</ListItemButton>
						</ListItem>
					))}
					{targetFiles.length === 0 && (
						<ListItem>
							<ListItemText
								primary="Nenhum outro arquivo no experimento"
								sx={{ color: "text.secondary", textAlign: "center" }}
							/>
						</ListItem>
					)}
				</List>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Cancelar</Button>
				<Button
					onClick={handleApply}
					variant="contained"
					disabled={selectedIds.size === 0 || loading}
				>
					{loading ? "Aplicando..." : `Aplicar (${selectedIds.size} arquivo${selectedIds.size !== 1 ? "s" : ""})`}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
