import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import {
	MdExpandMore as ExpandMore,
	MdChevronRight as ChevronRight,
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
} from "react-icons/md"
import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Button,
	IconButton,
	TextField,
	Typography,
} from "@mui/material"
import { ExperimentFiles, Gate } from "../../types"
import React, { useState } from "react"

export interface SelectedSource {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
}

// Função recursiva para renderizar os gates e seus sub-gates
const renderGate = (
	gate: Gate,
	parentId: string,
	onRequestDelete?: (gateId: number, gateName: string) => void,
	onRequestRename?: (gateId: number, gateName: string) => void,
) => {
	const itemId = `gate-${gate.id}-${parentId}`
	return (
		<TreeItem
			key={itemId}
			itemId={itemId}
			label={
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						width: "100%",
					}}
				>
					<span>🔲{gate.name}</span>
					<Box sx={{ display: "flex", gap: 0 }}>
						{onRequestRename && (
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation()
									onRequestRename(gate.id, gate.name)
								}}
								sx={{ p: 0.25 }}
								title="Renomear gate"
							>
								<EditIcon style={{ fontSize: 16 }} />
							</IconButton>
						)}
						{onRequestDelete && (
							<IconButton
								size="small"
								color="error"
								onClick={(e) => {
									e.stopPropagation()
									onRequestDelete(gate.id, gate.name)
								}}
								sx={{ p: 0.25 }}
								title="Excluir gate"
							>
								<DeleteIcon style={{ fontSize: 16 }} />
							</IconButton>
						)}
					</Box>
				</Box>
			}
		>
			{gate.children?.map((childGate) =>
				renderGate(childGate, itemId, onRequestDelete, onRequestRename),
			)}
		</TreeItem>
	)
}

// Função para renderizar os arquivos e seus gates
const renderFile = (
	file: ExperimentFiles,
	onRequestDelete?: (gateId: number, gateName: string) => void,
	onRequestRename?: (gateId: number, gateName: string) => void,
) => {
	const fileId = `file-${file.id}`
	return (
		<TreeItem key={fileId} itemId={fileId} label={`📄${file.file_name}`}>
			{file.gates.map((gate) =>
				renderGate(gate, fileId, onRequestDelete, onRequestRename),
			)}
		</TreeItem>
	)
}

// Procura recursivamente um gate (e seu file_data raiz) pela id.
const findGate = (gates: Gate[], id: number): Gate | undefined => {
	for (const gate of gates) {
		if (gate.id === id) return gate
		if (gate.children) {
			const found = findGate(gate.children, id)
			if (found) return found
		}
	}
	return undefined
}

export default function ParentTree({
	files,
	onSelect,
	onDeleteGate,
	onRenameGate,
}: {
	files: ExperimentFiles[]
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number) => void
	onRenameGate?: (gateId: number, newName: string) => void
}) {
	const [deleteTarget, setDeleteTarget] = useState<{
		id: number
		name: string
	} | null>(null)
	const [renameTarget, setRenameTarget] = useState<{
		id: number
		name: string
	} | null>(null)
	const [renameValue, setRenameValue] = useState("")

	const handleRequestDelete = (gateId: number, gateName: string) => {
		setDeleteTarget({ id: gateId, name: gateName })
	}

	const handleRequestRename = (gateId: number, gateName: string) => {
		setRenameTarget({ id: gateId, name: gateName })
		setRenameValue(gateName)
	}

	const handleConfirmRename = () => {
		if (renameTarget && onRenameGate && renameValue.trim()) {
			onRenameGate(renameTarget.id, renameValue.trim())
		}
		setRenameTarget(null)
		setRenameValue("")
	}

	const handleCancelRename = () => {
		setRenameTarget(null)
		setRenameValue("")
	}

	const handleConfirmDelete = () => {
		if (deleteTarget && onDeleteGate) {
			onDeleteGate(deleteTarget.id)
		}
		setDeleteTarget(null)
	}

	const handleCancelDelete = () => {
		setDeleteTarget(null)
	}

	const handleItemClick = (event: React.MouseEvent, itemId: string) => {
		// Paramos a propagação para evitar o evento do pai quando o filho é clicado
		event.stopPropagation()

		const isFile = itemId.startsWith("file-")
		const isGate = itemId.startsWith("gate-")
		const id = parseInt(itemId.split("-")[1])

		if (!isFile && !isGate) return

		if (isFile) {
			const file = files.find((f) => f.id === id)
			onSelect({
				type: "file",
				id,
				name: file?.file_name ?? `Arquivo ${id}`,
				fileDataId: id,
			})
		} else {
			let gate: Gate | undefined
			for (const file of files) {
				gate = findGate(file.gates, id)
				if (gate) break
			}
			onSelect({
				type: "gate",
				id,
				name: gate?.name ?? `Gate ${id}`,
				fileDataId: gate?.file_data ?? id,
			})
		}
	}

	return (
		<>
			<SimpleTreeView
				slots={{
					expandIcon: ChevronRight,
					collapseIcon: ExpandMore,
				}}
				onItemClick={handleItemClick}
				sx={(theme) => ({
					flexGrow: 1,
					overflowY: "auto",
					color: theme.palette.text.primary,
				})}
			>
				{files.map((file) =>
					renderFile(
						file,
						onDeleteGate ? handleRequestDelete : undefined,
						onRenameGate ? handleRequestRename : undefined,
					),
				)}
			</SimpleTreeView>

			<Dialog open={!!deleteTarget} onClose={handleCancelDelete}>
				<DialogTitle>Excluir Gate</DialogTitle>
				<DialogContent>
					<Typography>
						Tem certeza que deseja excluir o gate{" "}
						<strong>{deleteTarget?.name}</strong>? Esta ação não pode
						ser desfeita.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelDelete}>Cancelar</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
					>
						Excluir
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={!!renameTarget} onClose={handleCancelRename}>
				<DialogTitle>Renomear Gate</DialogTitle>
				<DialogContent>
					<TextField
						autoFocus
						label="Novo nome"
						value={renameValue}
						onChange={(e) => setRenameValue(e.target.value)}
						fullWidth
						sx={{ mt: 1 }}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleConfirmRename()
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCancelRename}>Cancelar</Button>
					<Button
						onClick={handleConfirmRename}
						variant="contained"
						disabled={!renameValue.trim()}
					>
						Salvar
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}
