import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Typography,
} from "@mui/material"
import { useState } from "react"
import { ExperimentFiles } from "../../types"
import FileSelectList from "../file_select_list"

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
		<Dialog
			open={open}
			onClose={handleClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Aplicar gate em outros arquivos</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 1 }}>
					Copiar <strong>{gateName}</strong> para os arquivos selecionados. As
					cópias acompanham o original em nome, cor e exclusão até que o desenho
					seja alterado só em uma amostra.
				</Typography>

				<FileSelectList
					files={targetFiles}
					selectedIds={selectedIds}
					onToggle={handleToggle}
					onSelectAll={handleSelectAll}
					emptyLabel="Nenhum outro arquivo no experimento"
					toolbarExtra={
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
					}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Cancelar</Button>
				<Button
					onClick={handleApply}
					variant="contained"
					disabled={selectedIds.size === 0 || loading}
				>
					{loading
						? "Aplicando..."
						: `Aplicar (${selectedIds.size} arquivo${selectedIds.size !== 1 ? "s" : ""})`}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
