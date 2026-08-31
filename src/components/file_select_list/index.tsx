import {
	Box,
	Checkbox,
	FormControlLabel,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Typography,
} from "@mui/material"
import React from "react"
import { ExperimentFiles } from "../../types"

interface FileSelectListProps {
	files: ExperimentFiles[]
	selectedIds: Set<number>
	onToggle: (fileId: number) => void
	onSelectAll: () => void
	emptyLabel?: string
	/** Conteúdo extra à direita do "Selecionar todos" (ex.: incluir sub-gates). */
	toolbarExtra?: React.ReactNode
}

/**
 * Lista de amostras com checkbox, compartilhada pelos diálogos que agem sobre
 * várias amostras do experimento (aplicar gate, excluir gates em lote).
 */
export default function FileSelectList({
	files,
	selectedIds,
	onToggle,
	onSelectAll,
	emptyLabel = "Nenhuma outra amostra no experimento",
	toolbarExtra,
}: FileSelectListProps) {
	const allSelected = selectedIds.size === files.length && files.length > 0

	return (
		<>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					flexWrap: "wrap",
					mb: 0.5,
				}}
			>
				<FormControlLabel
					control={
						<Checkbox
							checked={allSelected}
							indeterminate={
								selectedIds.size > 0 && selectedIds.size < files.length
							}
							onChange={onSelectAll}
							size="small"
						/>
					}
					label={<Typography variant="body2">Selecionar todos</Typography>}
				/>
				{toolbarExtra}
			</Box>

			<List
				dense
				sx={{
					maxHeight: 250,
					overflow: "auto",
					border: 1,
					borderColor: "divider",
					borderRadius: 1,
				}}
			>
				{files.map((file) => (
					<ListItem key={file.id} disablePadding>
						<ListItemButton onClick={() => onToggle(file.id)} dense>
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
				{files.length === 0 && (
					<ListItem>
						<ListItemText
							primary={emptyLabel}
							sx={{ color: "text.secondary", textAlign: "center" }}
						/>
					</ListItem>
				)}
			</List>
		</>
	)
}
