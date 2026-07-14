import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView"
import { TreeItem } from "@mui/x-tree-view/TreeItem"
import {
	MdExpandMore as ExpandMore,
	MdChevronRight as ChevronRight,
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
	MdMoreVert as MoreVertIcon,
	MdLink as LinkIcon,
	MdDriveFileMove as TransferIcon,
} from "react-icons/md"
import {
	Box,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Button,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem as MuiMenuItem,
	TextField,
	Tooltip,
	Typography,
	Divider,
} from "@mui/material"
import { MdInfoOutline as InfoIcon } from "react-icons/md"
import { ExperimentFiles, Gate } from "../../types"
import { getGateColor } from "../../constants/gateColors"
import { gateAxesLabel, findGateInTree } from "../../features/gate/utils"
import { fmtPct } from "../../utils/format"
import React, { useState } from "react"

export interface SelectedSource {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
	copiedFromId?: number | null
}



// Função recursiva para renderizar os gates e seus sub-gates
const renderGate = (
	gate: Gate,
	parentId: string,
	onRequestDelete?: (gateId: number, gateName: string) => void,
	onRequestRename?: (gateId: number, gateName: string) => void,
	onRequestApply?: (gateId: number, gateName: string) => void,
	gateIndex = 0,
	onMenuOpen?: (event: React.MouseEvent, gate: Gate) => void,
	onContextMenu?: (event: React.MouseEvent, gate: Gate) => void,
) => {
	const itemId = `gate-${gate.id}-${parentId}`
	const metrics = gate.analysis_result?.analysis_result?.summary_metrics
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
					onContextMenu={(e) => {
						if (onContextMenu) {
							e.preventDefault()
							e.stopPropagation()
							onContextMenu(e, gate)
						}
					}}
				>
					<Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Box
								component="span"
								sx={{
									display: "inline-block",
									width: 10,
									height: 10,
									borderRadius: "2px",
									backgroundColor: getGateColor(gate.color, gateIndex),
									flexShrink: 0,
								}}
							/>
							<span style={{ fontSize: "0.85rem" }}>{gate.name}</span>
							{gate.copied_from_id && (
								<Tooltip title={`Copiado de gate #${gate.copied_from_id}`} arrow>
									<Box sx={{ display: "inline-flex", alignItems: "center" }}>
										<LinkIcon style={{ fontSize: 14, color: "rgba(0,120,255,0.7)" }} />
									</Box>
								</Tooltip>
							)}
						</Box>
						{gateAxesLabel(gate.gate_coordinates) && (
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", pl: 2.5, lineHeight: 1.1, fontStyle: "italic" }}>
								{gateAxesLabel(gate.gate_coordinates)}
							</Typography>
						)}
						{metrics && (
							<Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.65rem", pl: 2.5, lineHeight: 1.2 }}>
								{metrics.count.toLocaleString()} events
								{" | "}
								%P {fmtPct(metrics.percent_of_parent_population)}
								{" | "}
								%T {fmtPct(metrics.percent_of_total_population)}
							</Typography>
						)}
					</Box>
					{(onRequestApply || onRequestRename || onRequestDelete) && (
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation()
								if (onMenuOpen) onMenuOpen(e, gate)
							}}
							sx={{ p: 0.25, flexShrink: 0 }}
							title="Opções do gate"
						>
							<MoreVertIcon style={{ fontSize: 16 }} />
						</IconButton>
					)}
				</Box>
			}
		>
			{gate.children?.map((childGate, childIdx) =>
				renderGate(childGate, itemId, onRequestDelete, onRequestRename, onRequestApply, childIdx, onMenuOpen, onContextMenu),
			)}
		</TreeItem>
	)
}

// Função para renderizar os arquivos e seus gates
const renderFile = (
	file: ExperimentFiles,
	onRequestDelete?: (gateId: number, gateName: string) => void,
	onRequestRename?: (gateId: number, gateName: string) => void,
	onRequestApply?: (gateId: number, gateName: string) => void,
	onMenuOpen?: (event: React.MouseEvent, gate: Gate) => void,
	onContextMenu?: (event: React.MouseEvent, gate: Gate) => void,
) => {
	const fileId = `file-${file.id}`
	return (
		<TreeItem key={fileId} itemId={fileId} label={
		<Typography sx={{ fontSize: "0.8rem" }}>📄{file.file_name}</Typography>
	}>
			{file.gates.map((gate, idx) =>
				renderGate(gate, fileId, onRequestDelete, onRequestRename, onRequestApply, idx, onMenuOpen, onContextMenu),
			)}
		</TreeItem>
	)
}



export default function ParentTree({
	files,
	onSelect,
	onDeleteGate,
	onRenameGate,
	onApplyGate,
}: {
	files: ExperimentFiles[]
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number) => void
	onRenameGate?: (gateId: number, newName: string) => void
	onApplyGate?: (gateId: number, gateName: string) => void
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

	// Hamburger menu state
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
	const [menuGate, setMenuGate] = useState<Gate | null>(null)

	// Context menu state (right-click)
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
	const [contextGate, setContextGate] = useState<Gate | null>(null)

	const handleMenuOpen = (event: React.MouseEvent, gate: Gate) => {
		event.stopPropagation()
		setMenuAnchor(event.currentTarget as HTMLElement)
		setMenuGate(gate)
	}

	const handleMenuClose = () => {
		setMenuAnchor(null)
		setMenuGate(null)
	}

	const handleContextMenu = (event: React.MouseEvent, gate: Gate) => {
		event.preventDefault()
		event.stopPropagation()
		setContextMenu({ x: event.clientX, y: event.clientY })
		setContextGate(gate)
	}

	const handleContextMenuClose = () => {
		setContextMenu(null)
		setContextGate(null)
	}

	// Menu actions
	const handleMenuApply = () => {
		if (menuGate && onApplyGate) onApplyGate(menuGate.id, menuGate.name)
		handleMenuClose()
	}

	const handleMenuRename = () => {
		if (menuGate) {
			setRenameTarget({ id: menuGate.id, name: menuGate.name })
			setRenameValue(menuGate.name)
		}
		handleMenuClose()
	}

	const handleMenuDelete = () => {
		if (menuGate) setDeleteTarget({ id: menuGate.id, name: menuGate.name })
		handleMenuClose()
	}

	// Context menu actions
	const handleCtxApply = () => {
		if (contextGate && onApplyGate) onApplyGate(contextGate.id, contextGate.name)
		handleContextMenuClose()
	}

	const handleCtxRename = () => {
		if (contextGate) {
			setRenameTarget({ id: contextGate.id, name: contextGate.name })
			setRenameValue(contextGate.name)
		}
		handleContextMenuClose()
	}

	const handleCtxDelete = () => {
		if (contextGate) setDeleteTarget({ id: contextGate.id, name: contextGate.name })
		handleContextMenuClose()
	}

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
			let fileDataId = id
			for (const file of files) {
				gate = findGateInTree(file.gates, id)
				if (gate) {
					fileDataId = file.id
					break
				}
			}
			onSelect({
				type: "gate",
				id,
				name: gate?.name ?? `Gate ${id}`,
				fileDataId,
				copiedFromId: gate?.copied_from_id,
			})
		}
	}

	return (
		<>
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
				<Tooltip
					title="%P = % of Parent (eventos no gate / eventos no gate pai) · %T = % of Total (eventos no gate / total do arquivo)"
					arrow
					placement="bottom-start"
				>
					<Box sx={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
						<InfoIcon style={{ fontSize: 14, opacity: 0.6 }} />
						<Typography variant="caption" sx={{ ml: 0.5, color: "text.secondary", fontSize: "0.7rem" }}>
							%P = Parent · %T = Total
						</Typography>
					</Box>
				</Tooltip>
			</Box>
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
						onApplyGate,
						handleMenuOpen,
						handleContextMenu,
					),
				)}
			</SimpleTreeView>

			{/* Hamburger dropdown menu (⋮ button) */}
			<Menu
				anchorEl={menuAnchor}
				open={Boolean(menuAnchor)}
				onClose={handleMenuClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{ paper: { sx: { minWidth: 180 } } }}
			>
				{onApplyGate && (
					<MuiMenuItem onClick={handleMenuApply} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<TransferIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Transferir para arquivos
						</ListItemText>
					</MuiMenuItem>
				)}
				{onRenameGate && (
					<MuiMenuItem onClick={handleMenuRename} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<EditIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Renomear
						</ListItemText>
					</MuiMenuItem>
				)}
				{(onApplyGate || onRenameGate) && onDeleteGate && <Divider />}
				{onDeleteGate && (
					<MuiMenuItem onClick={handleMenuDelete} dense sx={{ color: "error.main" }}>
						<ListItemIcon sx={{ minWidth: 28, color: "error.main" }}>
							<DeleteIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Excluir
						</ListItemText>
					</MuiMenuItem>
				)}
			</Menu>

			{/* Right-click context menu */}
			<Menu
				open={contextMenu !== null}
				onClose={handleContextMenuClose}
				anchorReference="anchorPosition"
				anchorPosition={
					contextMenu !== null
						? { top: contextMenu.y, left: contextMenu.x }
						: undefined
				}
				slotProps={{ paper: { sx: { minWidth: 180 } } }}
			>
				{onApplyGate && (
					<MuiMenuItem onClick={handleCtxApply} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<TransferIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Transferir para arquivos
						</ListItemText>
					</MuiMenuItem>
				)}
				{onRenameGate && (
					<MuiMenuItem onClick={handleCtxRename} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<EditIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Renomear
						</ListItemText>
					</MuiMenuItem>
				)}
				{(onApplyGate || onRenameGate) && onDeleteGate && <Divider />}
				{onDeleteGate && (
					<MuiMenuItem onClick={handleCtxDelete} dense sx={{ color: "error.main" }}>
						<ListItemIcon sx={{ minWidth: 28, color: "error.main" }}>
							<DeleteIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Excluir
						</ListItemText>
					</MuiMenuItem>
				)}
			</Menu>

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
