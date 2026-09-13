import {
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
	MdMoreVert as MoreVertIcon,
	MdLink as LinkIcon,
	MdDriveFileMove as TransferIcon,
	MdVisibilityOff as DisableIcon,
	MdRestoreFromTrash as EnableIcon,
	MdFolder as FolderIcon,
	MdCreateNewFolder as NewSubsampleIcon,
} from "react-icons/md"
import {
	Box,
	Checkbox,
	Chip,
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
	Select,
	TextField,
	Tooltip,
	Typography,
	Divider,
} from "@mui/material"
import { MdInfoOutline as InfoIcon } from "react-icons/md"
import { ExperimentFiles, Gate, Subsample } from "../../types"
import { getGateColor } from "../../constants/gateColors"
import { gateAxesLabel, gateAuthorLabel } from "../../features/gate/utils"
import {
	groupFilesBySubsample,
	hasSubsampleLevel,
	SubsampleGroup,
} from "../../features/experiment/utils/groupBySubsample"
import { fmtPct } from "../../utils/format"
import React, { useMemo, useState } from "react"
import TreeNode from "./TreeNode"
import {
	ArchiveSubsampleDialog,
	FileMetadataDialog,
	MoveFileDialog,
	SubsampleFormDialog,
} from "./dialogs"

export interface SelectedSource {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
	copiedFromId?: number | null
}

interface TreeHandlers {
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number, gateName: string) => void
	onRenameGate?: (gateId: number, newName: string) => void
	onApplyGate?: (gateId: number, gateName: string) => void
	onDisableFile?: (fileDataIds: number[]) => void
	onEnableFile?: (fileDataIds: number[]) => void
	onMenuOpen: (event: React.MouseEvent, gate: Gate) => void
	onContextMenu: (event: React.MouseEvent, gate: Gate) => void
	onFileMenuOpen: (event: React.MouseEvent, file: ExperimentFiles) => void
	onSubsampleMenuOpen?: (event: React.MouseEvent, subsample: Subsample) => void
	/** Seleção múltipla de amostras (mover em lote); omitido sem onMoveFile. */
	selectedFileIds?: Set<number>
	onToggleFile?: (fileId: number) => void
	onToggleGroup?: (fileIds: number[], checked: boolean) => void
	onFileInfo?: (file: ExperimentFiles) => void
}

// Renderiza um gate e seus sub-gates recursivamente
const renderGate = (
	gate: Gate,
	fileDataId: number,
	depth: number,
	gateIndex: number,
	handlers: TreeHandlers,
) => {
	const metrics = gate.analysis_result?.analysis_result?.summary_metrics
	const authorLabel = gateAuthorLabel(gate)
	const authorName = gate.created_by_name?.trim() || null
	const hasActions =
		handlers.onApplyGate || handlers.onRenameGate || handlers.onDeleteGate
	return (
		<TreeNode
			key={`gate-${gate.id}`}
			depth={depth}
			onSelect={() =>
				handlers.onSelect({
					type: "gate",
					id: gate.id,
					name: gate.name,
					fileDataId,
					copiedFromId: gate.copied_from_id,
				})
			}
			label={
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						width: "100%",
					}}
					onContextMenu={(e) => {
						e.preventDefault()
						e.stopPropagation()
						handlers.onContextMenu(e, gate)
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							minWidth: 0,
							flex: 1,
						}}
					>
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
							{authorName ? (
								<Tooltip title={authorLabel} arrow placement="top-start">
									<span style={{ fontSize: "0.85rem" }}>{gate.name}</span>
								</Tooltip>
							) : (
								<span style={{ fontSize: "0.85rem" }}>{gate.name}</span>
							)}
							{authorName && (
								<Chip
									label={authorName.split(" ")[0]}
									size="small"
									variant="outlined"
									sx={{
										height: 16,
										fontSize: "0.6rem",
										flexShrink: 0,
										"& .MuiChip-label": { px: 0.5 },
									}}
								/>
							)}
							{gate.copied_from_id && (
								<Tooltip
									title={`Copiado de gate #${gate.copied_from_id}`}
									arrow
								>
									<Box sx={{ display: "inline-flex", alignItems: "center" }}>
										<LinkIcon
											style={{ fontSize: 14, color: "rgba(0,120,255,0.7)" }}
										/>
									</Box>
								</Tooltip>
							)}
						</Box>
						{gateAxesLabel(gate.gate_coordinates) && (
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									pl: 2.5,
									lineHeight: 1.1,
									fontStyle: "italic",
								}}
							>
								{gateAxesLabel(gate.gate_coordinates)}
							</Typography>
						)}
						{metrics && (
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									pl: 2.5,
									lineHeight: 1.2,
								}}
							>
								{metrics.count.toLocaleString()} events
								{" | "}
								%P {fmtPct(metrics.percent_of_parent_population)}
								{" | "}
								%T {fmtPct(metrics.percent_of_total_population)}
							</Typography>
						)}
					</Box>
					{hasActions && (
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation()
								handlers.onMenuOpen(e, gate)
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
				renderGate(childGate, fileDataId, depth + 1, childIdx, handlers),
			)}
		</TreeNode>
	)
}

// Renderiza uma amostra e seus gates
const renderFile = (
	file: ExperimentFiles,
	depth: number,
	handlers: TreeHandlers,
) => {
	const inactive = file.active === false
	const canManage = handlers.onDisableFile || handlers.onEnableFile
	// No modo de seleção, clicar na linha marca/desmarca — não troca a amostra.
	const selecting = !!handlers.onToggleFile
	return (
		<TreeNode
			key={`file-${file.id}`}
			depth={depth}
			onSelect={
				inactive
					? undefined
					: selecting
						? () => handlers.onToggleFile?.(file.id)
						: () =>
								handlers.onSelect({
									type: "file",
									id: file.id,
									name: file.file_name,
									fileDataId: file.id,
								})
			}
			label={
				<Box
					sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
				>
					{handlers.onToggleFile && (
						<Checkbox
							size="small"
							checked={handlers.selectedFileIds?.has(file.id) ?? false}
							onClick={(e) => e.stopPropagation()}
							onChange={() => handlers.onToggleFile?.(file.id)}
							sx={{ p: 0.25 }}
						/>
					)}
					<Typography
						sx={{ fontSize: "0.8rem", opacity: inactive ? 0.5 : 1 }}
						noWrap
					>
						📄{file.file_name}
					</Typography>
					{inactive && (
						<Chip
							label="Desabilitada"
							size="small"
							sx={{ height: 16, fontSize: "0.6rem", flexShrink: 0 }}
						/>
					)}
					<Box sx={{ ml: "auto", display: "flex", flexShrink: 0 }}>
						{handlers.onFileInfo && (
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation()
									handlers.onFileInfo?.(file)
								}}
								sx={{ p: 0.25 }}
								title="Metadados do arquivo"
							>
								<InfoIcon style={{ fontSize: 15, opacity: 0.6 }} />
							</IconButton>
						)}
						{canManage && (
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation()
									handlers.onFileMenuOpen(e, file)
								}}
								sx={{ p: 0.25 }}
								title="Opções da amostra"
							>
								<MoreVertIcon style={{ fontSize: 16 }} />
							</IconButton>
						)}
					</Box>
				</Box>
			}
		>
			{file.gates.map((gate, idx) =>
				renderGate(gate, file.id, depth + 1, idx, handlers),
			)}
		</TreeNode>
	)
}

// Nível subsample: agrupador, não selecionável
const renderSubsampleGroup = (
	group: SubsampleGroup,
	handlers: TreeHandlers,
) => {
	const name =
		group.subsample?.name ??
		(group.subsampleId !== null
			? `Subsample #${group.subsampleId}`
			: "Sem subsample")
	// Checkbox "selecionar grupo" — visível só no modo de seleção.
	const selectedCount = group.files.filter((f) =>
		handlers.selectedFileIds?.has(f.id),
	).length
	const allChecked =
		group.files.length > 0 && selectedCount === group.files.length
	return (
		<TreeNode
			key={
				group.subsampleId !== null
					? `subsample-${group.subsampleId}`
					: "subsample-none"
			}
			depth={0}
			label={
				<Box
					sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
				>
					{handlers.onToggleGroup && (
						<Checkbox
							size="small"
							checked={allChecked}
							indeterminate={!allChecked && selectedCount > 0}
							onClick={(e) => e.stopPropagation()}
							onChange={(e) =>
								handlers.onToggleGroup?.(
									group.files.map((f) => f.id),
									e.target.checked,
								)
							}
							sx={{ p: 0.25 }}
						/>
					)}
					<FolderIcon style={{ fontSize: 15, flexShrink: 0, opacity: 0.7 }} />
					<Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }} noWrap>
						{name}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.65rem", flexShrink: 0 }}
					>
						{group.files.length}{" "}
						{group.files.length === 1 ? "amostra" : "amostras"}
					</Typography>
					{group.subsample && handlers.onSubsampleMenuOpen && (
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation()
								handlers.onSubsampleMenuOpen?.(e, group.subsample!)
							}}
							sx={{ p: 0.25, flexShrink: 0, ml: "auto" }}
							title="Opções do subsample"
						>
							<MoreVertIcon style={{ fontSize: 16 }} />
						</IconButton>
					)}
				</Box>
			}
		>
			{group.files.map((file) => renderFile(file, 1, handlers))}
		</TreeNode>
	)
}

export default function ParentTree({
	files,
	subsamples = [],
	onSelect,
	onDeleteGate,
	onRenameGate,
	onApplyGate,
	onDisableFile,
	onEnableFile,
	onCreateSubsample,
	onRenameSubsample,
	onArchiveSubsample,
	onMoveFile,
}: {
	files: ExperimentFiles[]
	subsamples?: Subsample[]
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number, gateName: string) => void
	onRenameGate?: (gateId: number, newName: string) => void
	onApplyGate?: (gateId: number, gateName: string) => void
	onDisableFile?: (fileDataIds: number[]) => void
	onEnableFile?: (fileDataIds: number[]) => void
	onCreateSubsample?: (name: string) => Promise<string | null>
	onRenameSubsample?: (
		subsampleId: number,
		name: string,
	) => Promise<string | null>
	onArchiveSubsample?: (subsampleId: number) => void
	onMoveFile?: (fileDataIds: number[], subsampleId: number | null) => void
}) {
	const [renameTarget, setRenameTarget] = useState<{
		id: number
		name: string
	} | null>(null)
	const [renameValue, setRenameValue] = useState("")

	// Hamburger menu state
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
	const [menuGate, setMenuGate] = useState<Gate | null>(null)

	// Context menu state (right-click)
	const [contextMenu, setContextMenu] = useState<{
		x: number
		y: number
	} | null>(null)
	const [contextGate, setContextGate] = useState<Gate | null>(null)

	// Menu e confirmação por amostra (desabilitar / reativar / mover)
	const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(null)
	const [menuFile, setMenuFile] = useState<ExperimentFiles | null>(null)
	const [disableTargets, setDisableTargets] = useState<ExperimentFiles[]>([])
	// Seleção em lote: select liga o modo; as ações (mover/desabilitar/reativar)
	// aparecem como chips com a contagem de selecionadas.
	const [selectionMode, setSelectionMode] = useState(false)
	const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set())
	const [moveTargets, setMoveTargets] = useState<ExperimentFiles[]>([])
	const [metadataTarget, setMetadataTarget] = useState<ExperimentFiles | null>(
		null,
	)

	// Subsample: menu ⋮ do grupo + diálogo de criar/renomear + arquivar
	const [subsampleMenuAnchor, setSubsampleMenuAnchor] =
		useState<null | HTMLElement>(null)
	const [menuSubsample, setMenuSubsample] = useState<Subsample | null>(null)
	const [subsampleFormOpen, setSubsampleFormOpen] = useState(false)
	const [subsampleFormTarget, setSubsampleFormTarget] =
		useState<Subsample | null>(null)
	const [archiveTarget, setArchiveTarget] = useState<Subsample | null>(null)

	const groups = useMemo(
		() => groupFilesBySubsample(files, subsamples),
		[files, subsamples],
	)
	const grouped = hasSubsampleLevel(groups)

	const handleFileMenuOpen = (
		event: React.MouseEvent,
		file: ExperimentFiles,
	) => {
		event.stopPropagation()
		setFileMenuAnchor(event.currentTarget as HTMLElement)
		setMenuFile(file)
	}

	const handleFileMenuClose = () => {
		setFileMenuAnchor(null)
		setMenuFile(null)
	}

	const handleFileMenuDisable = () => {
		if (menuFile) setDisableTargets([menuFile])
		handleFileMenuClose()
	}

	const handleFileMenuEnable = () => {
		if (menuFile && onEnableFile) onEnableFile([menuFile.id])
		handleFileMenuClose()
	}

	const handleFileMenuMove = () => {
		if (menuFile) setMoveTargets([menuFile])
		handleFileMenuClose()
	}

	const handleToggleFile = (fileId: number) => {
		setSelectedFileIds((prev) => {
			const next = new Set(prev)
			if (next.has(fileId)) next.delete(fileId)
			else next.add(fileId)
			return next
		})
	}

	const handleToggleGroup = (fileIds: number[], checked: boolean) => {
		setSelectedFileIds((prev) => {
			const next = new Set(prev)
			fileIds.forEach((id) => (checked ? next.add(id) : next.delete(id)))
			return next
		})
	}

	const selectedFiles = files.filter((f) => selectedFileIds.has(f.id))

	const handleMoveSelected = () => {
		if (selectedFiles.length > 0) setMoveTargets(selectedFiles)
	}

	const handleDisableSelected = () => {
		if (selectedFiles.length > 0) setDisableTargets(selectedFiles)
	}

	const handleEnableSelected = () => {
		if (selectedFiles.length > 0 && onEnableFile)
			onEnableFile(selectedFiles.map((f) => f.id))
	}

	const handleSubsampleMenuOpen = (
		event: React.MouseEvent,
		subsample: Subsample,
	) => {
		event.stopPropagation()
		setSubsampleMenuAnchor(event.currentTarget as HTMLElement)
		setMenuSubsample(subsample)
	}

	const handleSubsampleMenuClose = () => {
		setSubsampleMenuAnchor(null)
		setMenuSubsample(null)
	}

	const handleSubsampleMenuRename = () => {
		if (menuSubsample) {
			setSubsampleFormTarget(menuSubsample)
			setSubsampleFormOpen(true)
		}
		handleSubsampleMenuClose()
	}

	const handleSubsampleMenuArchive = () => {
		if (menuSubsample) setArchiveTarget(menuSubsample)
		handleSubsampleMenuClose()
	}

	const handleSubsampleFormSubmit = async (name: string) => {
		if (subsampleFormTarget && onRenameSubsample) {
			return onRenameSubsample(subsampleFormTarget.id, name)
		}
		if (onCreateSubsample) return onCreateSubsample(name)
		return "Ação indisponível"
	}

	const canBulk = !!(onMoveFile || onDisableFile || onEnableFile)

	const handleConfirmDisable = () => {
		if (disableTargets.length > 0 && onDisableFile)
			onDisableFile(disableTargets.map((f) => f.id))
		setDisableTargets([])
		setSelectedFileIds(new Set())
	}

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
		if (menuGate && onDeleteGate) onDeleteGate(menuGate.id, menuGate.name)
		handleMenuClose()
	}

	// Context menu actions
	const handleCtxApply = () => {
		if (contextGate && onApplyGate)
			onApplyGate(contextGate.id, contextGate.name)
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
		if (contextGate && onDeleteGate)
			onDeleteGate(contextGate.id, contextGate.name)
		handleContextMenuClose()
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

	const handlers: TreeHandlers = {
		onSelect,
		onDeleteGate,
		onRenameGate,
		onApplyGate,
		onDisableFile,
		onEnableFile,
		onMenuOpen: handleMenuOpen,
		onContextMenu: handleContextMenu,
		onFileMenuOpen: handleFileMenuOpen,
		onSubsampleMenuOpen:
			onRenameSubsample || onArchiveSubsample
				? handleSubsampleMenuOpen
				: undefined,
		selectedFileIds,
		onToggleFile: canBulk && selectionMode ? handleToggleFile : undefined,
		onToggleGroup: canBulk && selectionMode ? handleToggleGroup : undefined,
		onFileInfo: setMetadataTarget,
	}

	return (
		<>
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
				<Tooltip
					title="%P = % of Parent (eventos no gate / eventos no gate pai) · %T = % of Total (eventos no gate / total do arquivo)"
					arrow
					placement="bottom-start"
				>
					<Box
						sx={{
							display: "inline-flex",
							alignItems: "center",
							cursor: "help",
						}}
					>
						<InfoIcon style={{ fontSize: 14, opacity: 0.6 }} />
						<Typography
							variant="caption"
							sx={{ ml: 0.5, color: "text.secondary", fontSize: "0.7rem" }}
						>
							%P = Parent · %T = Total
						</Typography>
					</Box>
				</Tooltip>
				{canBulk && (
					<Select
						size="small"
						value={selectionMode ? "multi" : "nav"}
						onChange={(e) => {
							setSelectionMode(e.target.value === "multi")
							setSelectedFileIds(new Set())
						}}
						sx={{
							ml: "auto",
							height: 24,
							fontSize: "0.72rem",
							"& .MuiSelect-select": { py: 0.25, pr: "24px !important" },
						}}
					>
						<MuiMenuItem value="nav" sx={{ fontSize: "0.75rem" }} dense>
							Navegar
						</MuiMenuItem>
						<MuiMenuItem value="multi" sx={{ fontSize: "0.75rem" }} dense>
							Selecionar
						</MuiMenuItem>
					</Select>
				)}
				{selectionMode && selectedFileIds.size > 0 && (
					<>
						{onMoveFile && (
							<Chip
								label={`Mover ${selectedFileIds.size}`}
								size="small"
								color="primary"
								onClick={handleMoveSelected}
								sx={{ height: 22, fontSize: "0.7rem" }}
							/>
						)}
						{onDisableFile && (
							<Chip
								label={`Desabilitar ${selectedFileIds.size}`}
								size="small"
								color="warning"
								variant="outlined"
								onClick={handleDisableSelected}
								sx={{ height: 22, fontSize: "0.7rem" }}
							/>
						)}
						{onEnableFile && (
							<Chip
								label={`Reativar ${selectedFileIds.size}`}
								size="small"
								color="success"
								variant="outlined"
								onClick={handleEnableSelected}
								sx={{ height: 22, fontSize: "0.7rem" }}
							/>
						)}
					</>
				)}
				{onCreateSubsample && (
					<Tooltip title="Novo subsample" arrow>
						<IconButton
							size="small"
							onClick={() => {
								setSubsampleFormTarget(null)
								setSubsampleFormOpen(true)
							}}
							sx={{ p: 0.25, ml: canBulk ? 0 : "auto" }}
						>
							<NewSubsampleIcon style={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>
				)}
			</Box>
			<Box
				role="tree"
				sx={(theme) => ({
					flexGrow: 1,
					overflowY: "auto",
					color: theme.palette.text.primary,
				})}
			>
				{grouped
					? groups.map((group) => renderSubsampleGroup(group, handlers))
					: files.map((file) => renderFile(file, 0, handlers))}
			</Box>

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
					<MuiMenuItem
						onClick={handleMenuDelete}
						dense
						sx={{ color: "error.main" }}
					>
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
					<MuiMenuItem
						onClick={handleCtxDelete}
						dense
						sx={{ color: "error.main" }}
					>
						<ListItemIcon sx={{ minWidth: 28, color: "error.main" }}>
							<DeleteIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Excluir
						</ListItemText>
					</MuiMenuItem>
				)}
			</Menu>

			{/* Menu de ações do subsample */}
			<Menu
				anchorEl={subsampleMenuAnchor}
				open={Boolean(subsampleMenuAnchor)}
				onClose={handleSubsampleMenuClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{ paper: { sx: { minWidth: 180 } } }}
			>
				{onRenameSubsample && (
					<MuiMenuItem onClick={handleSubsampleMenuRename} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<EditIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Renomear
						</ListItemText>
					</MuiMenuItem>
				)}
				{onArchiveSubsample && (
					<MuiMenuItem onClick={handleSubsampleMenuArchive} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<DisableIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Arquivar
						</ListItemText>
					</MuiMenuItem>
				)}
			</Menu>

			{/* Menu de ações da amostra */}
			<Menu
				anchorEl={fileMenuAnchor}
				open={Boolean(fileMenuAnchor)}
				onClose={handleFileMenuClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{ paper: { sx: { minWidth: 200 } } }}
			>
				{onMoveFile && menuFile?.active !== false && (
					<MuiMenuItem onClick={handleFileMenuMove} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<TransferIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Mover para subsample…
						</ListItemText>
					</MuiMenuItem>
				)}
				{menuFile?.active === false
					? onEnableFile && (
							<MuiMenuItem onClick={handleFileMenuEnable} dense>
								<ListItemIcon sx={{ minWidth: 28 }}>
									<EnableIcon style={{ fontSize: 18 }} />
								</ListItemIcon>
								<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
									Reativar amostra
								</ListItemText>
							</MuiMenuItem>
						)
					: onDisableFile && (
							<MuiMenuItem onClick={handleFileMenuDisable} dense>
								<ListItemIcon sx={{ minWidth: 28 }}>
									<DisableIcon style={{ fontSize: 18 }} />
								</ListItemIcon>
								<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
									Desabilitar amostra
								</ListItemText>
							</MuiMenuItem>
						)}
			</Menu>

			<SubsampleFormDialog
				open={subsampleFormOpen}
				target={subsampleFormTarget}
				onSubmit={handleSubsampleFormSubmit}
				onClose={() => setSubsampleFormOpen(false)}
			/>

			<ArchiveSubsampleDialog
				target={archiveTarget}
				onConfirm={(id) => {
					onArchiveSubsample?.(id)
					setArchiveTarget(null)
				}}
				onClose={() => setArchiveTarget(null)}
			/>

			<MoveFileDialog
				files={moveTargets}
				subsamples={subsamples}
				onConfirm={(fileDataIds, subsampleId) => {
					onMoveFile?.(fileDataIds, subsampleId)
					setMoveTargets([])
					setSelectedFileIds(new Set())
				}}
				onClose={() => setMoveTargets([])}
			/>

			<FileMetadataDialog
				file={metadataTarget}
				onClose={() => setMetadataTarget(null)}
			/>

			<Dialog
				open={disableTargets.length > 0}
				onClose={() => setDisableTargets([])}
				fullWidth
				maxWidth="xs"
				PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
			>
				<DialogTitle>
					{disableTargets.length > 1
						? `Desabilitar ${disableTargets.length} amostras`
						: "Desabilitar amostra"}
				</DialogTitle>
				<DialogContent>
					<Typography>
						{disableTargets.length === 1 ? (
							<>
								A amostra <strong>{disableTargets[0]?.file_name}</strong> sai da
								listagem,{" "}
							</>
						) : (
							<>
								As <strong>{disableTargets.length} amostras</strong>{" "}
								selecionadas saem da listagem,{" "}
							</>
						)}
						mas nada é apagado: os gates e os dados ficam preservados e você
						pode reativar depois pelo filtro “Mostrar desabilitadas”.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDisableTargets([])}>Cancelar</Button>
					<Button onClick={handleConfirmDisable} variant="contained">
						Desabilitar
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
