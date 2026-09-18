import {
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
	MdDriveFileMove as TransferIcon,
	MdVisibilityOff as DisableIcon,
	MdRestoreFromTrash as EnableIcon,
	MdCreateNewFolder as NewSubsampleIcon,
	MdSelectAll as SelectAllIcon,
	MdInfoOutline as InfoIcon,
	MdOutlineBlurOn as CompensationIcon,
	MdLocalOffer as TagIcon,
	MdUnfoldMore as ExpandAllIcon,
	MdUnfoldLess as CollapseAllIcon,
	MdSearch as SearchIcon,
	MdClose as ClearIcon,
} from "react-icons/md"
import {
	Box,
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
	Tooltip,
	Typography,
	Divider,
	InputAdornment,
	TextField,
} from "@mui/material"
import { useMemo, useState } from "react"
import type {
	ExperimentFiles,
	SelectedSource,
	Subsample,
} from "../../../../types"
import {
	groupFilesBySubsample,
	hasSubsampleLevel,
} from "../../utils/groupBySubsample"
import {
	filterFilesByQuery,
	filterGroupsByQuery,
	normalizeQuery,
} from "../../utils/treeFilter"
import { useTreeInteractions } from "../../hooks/useTreeInteractions"
import { findFileForGate, getCopyFamilyIds } from "../../../gate/utils"
import GateEditDialog from "../../../gate/components/gate-edit-dialog"
import type { GateEditPayload } from "./types"
import FileTreeItem from "./FileTreeItem"
import SubsampleGroupItem from "./SubsampleGroupItem"
import {
	ArchiveSubsampleDialog,
	FileMetadataDialog,
	MoveFileDialog,
	SubsampleControlDialog,
	SubsampleFormDialog,
} from "./dialogs"
import FileTagsDialog from "../../../tags/components/FileTagsDialog"
import type { TagTarget } from "../../../tags/utils/tagTargets"

export default function ParentTree({
	files,
	subsamples = [],
	onSelect,
	onDeleteGate,
	onEditGate,
	onApplyGate,
	onDisableFile,
	onEnableFile,
	onCreateSubsample,
	onRenameSubsample,
	onArchiveSubsample,
	onMoveFile,
	onSetSubsampleControl,
	onSaveFileTags,
	channels = [],
	source,
}: {
	files: ExperimentFiles[]
	subsamples?: Subsample[]
	/** Fonte carregada no plot — destaca o nó na árvore (FE-26). */
	source?: SelectedSource | null
	onSelect: (source: SelectedSource) => void
	onDeleteGate?: (gateId: number, gateName: string) => void
	onEditGate?: (
		gateId: number,
		payload: GateEditPayload,
	) => Promise<string | null>
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
	onSetSubsampleControl?: (
		subsampleId: number,
		payload: {
			control_type: "unstained" | "single_stain" | null
			control_channel?: string
		},
	) => Promise<string | null>
	/** Substitui as tags explícitas de uma ou mais amostras (BE-34). */
	onSaveFileTags?: (targets: TagTarget[]) => Promise<string | null>
	/** Canais do experimento — alimenta o select do controle single-stain. */
	channels?: string[]
}) {
	const {
		handlers,
		expansion,
		selection,
		gateMenu,
		gateContextMenu,
		fileMenu,
		subsampleMenu,
		editDialog,
		disableDialog,
		moveDialog,
		metadataDialog,
		subsampleForm,
		archiveDialog,
		controlDialog,
		tagDialog,
	} = useTreeInteractions({
		files,
		onSelect,
		onDeleteGate,
		onEditGate,
		onApplyGate,
		onDisableFile,
		onEnableFile,
		onCreateSubsample,
		onRenameSubsample,
		onArchiveSubsample,
		onMoveFile,
		onSetSubsampleControl,
		onSaveFileTags,
	})

	const groups = useMemo(
		() => groupFilesBySubsample(files, subsamples),
		[files, subsamples],
	)
	const grouped = hasSubsampleLevel(groups)

	// FE-38: busca de amostras — filtra por nome, tag e subsample; enquanto
	// filtra, os nós abrem forçado para o match não ficar oculto.
	const [query, setQuery] = useState("")
	const searching = normalizeQuery(query).length > 0
	const visibleGroups = useMemo(
		() => filterGroupsByQuery(groups, query),
		[groups, query],
	)
	const visibleFiles = useMemo(
		() => filterFilesByQuery(files, query),
		[files, query],
	)
	const matchCount = grouped
		? visibleGroups.reduce((n, g) => n + g.files.length, 0)
		: visibleFiles.length
	const treeHandlers = useMemo(
		() => ({ ...handlers, selectedSource: source, forceExpanded: searching }),
		[handlers, source, searching],
	)

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
				{selection.canBulk && (
					<Tooltip
						title={
							selection.mode ? "Concluir seleção" : "Selecionar várias amostras"
						}
						arrow
					>
						<IconButton
							size="small"
							onClick={selection.toggleMode}
							sx={{ p: 0.25, ml: "auto" }}
							color={selection.mode ? "primary" : "default"}
						>
							<SelectAllIcon style={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>
				)}
				<Tooltip title="Expandir tudo" arrow>
					<IconButton
						size="small"
						onClick={expansion.expandAll}
						sx={{ p: 0.25 }}
					>
						<ExpandAllIcon style={{ fontSize: 18 }} />
					</IconButton>
				</Tooltip>
				<Tooltip title="Recolher tudo" arrow>
					<IconButton
						size="small"
						onClick={expansion.collapseAll}
						sx={{ p: 0.25 }}
					>
						<CollapseAllIcon style={{ fontSize: 18 }} />
					</IconButton>
				</Tooltip>
				{selection.mode && selection.count > 0 && (
					<>
						{onMoveFile && (
							<Chip
								label={`Mover ${selection.count}`}
								size="small"
								color="primary"
								onClick={selection.moveSelected}
								sx={{ height: 22, fontSize: "0.7rem" }}
							/>
						)}
						{onSaveFileTags && (
							<Chip
								label={`Etiquetar ${selection.activeCount}`}
								size="small"
								color="secondary"
								disabled={selection.activeCount === 0}
								onClick={selection.tagSelected}
								sx={{ height: 22, fontSize: "0.7rem" }}
							/>
						)}
						{onDisableFile && (
							<Chip
								label={`Desabilitar ${selection.activeCount}`}
								size="small"
								color="warning"
								variant="outlined"
								disabled={selection.activeCount === 0}
								onClick={selection.disableSelected}
								sx={{ height: 22, fontSize: "0.7rem" }}
							/>
						)}
						{onEnableFile && (
							<Chip
								label={`Reativar ${selection.inactiveCount}`}
								size="small"
								color="success"
								variant="outlined"
								disabled={selection.inactiveCount === 0}
								onClick={selection.enableSelected}
								sx={{ height: 22, fontSize: "0.7rem" }}
							/>
						)}
					</>
				)}
				{onCreateSubsample && (
					<Tooltip title="Novo subsample" arrow>
						<IconButton
							size="small"
							onClick={subsampleForm.openNew}
							sx={{ p: 0.25, ml: selection.canBulk ? 0 : "auto" }}
						>
							<NewSubsampleIcon style={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>
				)}
			</Box>
			<TextField
				size="small"
				label="Buscar"
				placeholder="nome, tag ou subsample…"
				fullWidth
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				sx={{
					mb: 0.5,
					"& .MuiInputBase-input": { py: 0.5, fontSize: "0.8rem" },
				}}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon style={{ fontSize: 16 }} />
						</InputAdornment>
					),
					endAdornment: searching ? (
						<InputAdornment position="end">
							<IconButton
								size="small"
								aria-label="Limpar busca"
								onClick={() => setQuery("")}
								sx={{ p: 0.25 }}
							>
								<ClearIcon style={{ fontSize: 14 }} />
							</IconButton>
						</InputAdornment>
					) : undefined,
				}}
			/>
			<Box
				role="tree"
				sx={(theme) => ({
					flexGrow: 1,
					overflowY: "auto",
					color: theme.palette.text.primary,
				})}
			>
				{searching && (
					<Typography
						variant="caption"
						sx={{
							display: "block",
							px: 0.5,
							pb: 0.5,
							color: "text.secondary",
							fontSize: "0.7rem",
						}}
					>
						{matchCount > 0
							? `${matchCount} de ${files.length} ${
									files.length === 1 ? "amostra" : "amostras"
								}`
							: "Nenhuma amostra encontrada"}
					</Typography>
				)}
				{grouped
					? visibleGroups.map((group) => (
							<SubsampleGroupItem
								key={
									group.subsampleId !== null
										? `subsample-${group.subsampleId}`
										: "subsample-none"
								}
								group={group}
								handlers={treeHandlers}
							/>
						))
					: visibleFiles.map((file) => (
							<FileTreeItem
								key={`file-${file.id}`}
								file={file}
								depth={0}
								handlers={treeHandlers}
							/>
						))}
			</Box>

			{/* Hamburger dropdown menu (⋮ button) */}
			<Menu
				anchorEl={gateMenu.anchor}
				open={Boolean(gateMenu.anchor)}
				onClose={gateMenu.close}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{ paper: { sx: { minWidth: 180 } } }}
			>
				{onApplyGate && (
					<MuiMenuItem onClick={gateMenu.apply} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<TransferIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Transferir para arquivos
						</ListItemText>
					</MuiMenuItem>
				)}
				{onEditGate && (
					<MuiMenuItem onClick={gateMenu.edit} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<EditIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Editar
						</ListItemText>
					</MuiMenuItem>
				)}
				{(onApplyGate || onEditGate) && onDeleteGate && <Divider />}
				{onDeleteGate && (
					<MuiMenuItem
						onClick={gateMenu.remove}
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
				open={gateContextMenu.position !== null}
				onClose={gateContextMenu.close}
				anchorReference="anchorPosition"
				anchorPosition={
					gateContextMenu.position !== null
						? {
								top: gateContextMenu.position.y,
								left: gateContextMenu.position.x,
							}
						: undefined
				}
				slotProps={{ paper: { sx: { minWidth: 180 } } }}
			>
				{onApplyGate && (
					<MuiMenuItem onClick={gateContextMenu.apply} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<TransferIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Transferir para arquivos
						</ListItemText>
					</MuiMenuItem>
				)}
				{onEditGate && (
					<MuiMenuItem onClick={gateContextMenu.edit} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<EditIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Editar
						</ListItemText>
					</MuiMenuItem>
				)}
				{(onApplyGate || onEditGate) && onDeleteGate && <Divider />}
				{onDeleteGate && (
					<MuiMenuItem
						onClick={gateContextMenu.remove}
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
				anchorEl={subsampleMenu.anchor}
				open={Boolean(subsampleMenu.anchor)}
				onClose={subsampleMenu.close}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{ paper: { sx: { minWidth: 180 } } }}
			>
				{onRenameSubsample && (
					<MuiMenuItem onClick={subsampleMenu.rename} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<EditIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Renomear
						</ListItemText>
					</MuiMenuItem>
				)}
				{onSetSubsampleControl && (
					<MuiMenuItem onClick={subsampleMenu.control} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<CompensationIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							{subsampleMenu.subsample?.control_type
								? "Editar controle de compensação…"
								: "Marcar como controle…"}
						</ListItemText>
					</MuiMenuItem>
				)}
				{onArchiveSubsample && (
					<MuiMenuItem onClick={subsampleMenu.archive} dense>
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
				anchorEl={fileMenu.anchor}
				open={Boolean(fileMenu.anchor)}
				onClose={fileMenu.close}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				slotProps={{ paper: { sx: { minWidth: 200 } } }}
			>
				{onMoveFile && fileMenu.file?.active !== false && (
					<MuiMenuItem onClick={fileMenu.move} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<TransferIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Mover para subsample…
						</ListItemText>
					</MuiMenuItem>
				)}
				{onSaveFileTags && fileMenu.file?.active !== false && (
					<MuiMenuItem onClick={fileMenu.tags} dense>
						<ListItemIcon sx={{ minWidth: 28 }}>
							<TagIcon style={{ fontSize: 18 }} />
						</ListItemIcon>
						<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
							Etiquetas…
						</ListItemText>
					</MuiMenuItem>
				)}
				{fileMenu.file?.active === false
					? onEnableFile && (
							<MuiMenuItem onClick={fileMenu.enable} dense>
								<ListItemIcon sx={{ minWidth: 28 }}>
									<EnableIcon style={{ fontSize: 18 }} />
								</ListItemIcon>
								<ListItemText primaryTypographyProps={{ fontSize: "0.85rem" }}>
									Reativar amostra
								</ListItemText>
							</MuiMenuItem>
						)
					: onDisableFile && (
							<MuiMenuItem onClick={fileMenu.disable} dense>
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
				open={subsampleForm.open}
				target={subsampleForm.target}
				onSubmit={subsampleForm.submit}
				onClose={subsampleForm.close}
			/>

			<ArchiveSubsampleDialog
				target={archiveDialog.target}
				onConfirm={archiveDialog.confirm}
				onClose={archiveDialog.close}
			/>

			<MoveFileDialog
				files={moveDialog.targets}
				subsamples={subsamples}
				onConfirm={moveDialog.confirm}
				onClose={moveDialog.close}
			/>

			<FileMetadataDialog
				file={metadataDialog.file}
				onClose={metadataDialog.close}
				onEditTags={
					onSaveFileTags
						? (f) => {
								metadataDialog.close()
								tagDialog.open(f)
							}
						: undefined
				}
			/>

			{controlDialog.submit && (
				<SubsampleControlDialog
					target={controlDialog.target}
					channels={channels}
					onSubmit={controlDialog.submit}
					onClose={controlDialog.close}
				/>
			)}

			{tagDialog.submit && (
				<FileTagsDialog
					files={tagDialog.targets}
					onSubmit={tagDialog.submit}
					onClose={tagDialog.close}
				/>
			)}

			<Dialog
				open={disableDialog.targets.length > 0}
				onClose={disableDialog.close}
				fullWidth
				maxWidth="xs"
				PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
			>
				<DialogTitle>
					{disableDialog.targets.length > 1
						? `Desabilitar ${disableDialog.targets.length} amostras`
						: "Desabilitar amostra"}
				</DialogTitle>
				<DialogContent>
					<Typography>
						{disableDialog.targets.length === 1 ? (
							<>
								A amostra <strong>{disableDialog.targets[0]?.file_name}</strong>{" "}
								sai da listagem,{" "}
							</>
						) : (
							<>
								As <strong>{disableDialog.targets.length} amostras</strong>{" "}
								selecionadas saem da listagem,{" "}
							</>
						)}
						mas nada é apagado: os gates e os dados ficam preservados e você
						pode reativar depois pelo filtro “Mostrar desabilitadas”.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={disableDialog.close}>Cancelar</Button>
					<Button onClick={disableDialog.confirm} variant="contained">
						Desabilitar
					</Button>
				</DialogActions>
			</Dialog>

			{/* FE-23: edição completa do gate pela árvore — mesmo diálogo do
				gráfico (nome + cor + escopo opt-in). */}
			<GateEditDialog
				open={!!editDialog.gate}
				gate={editDialog.gate}
				name={editDialog.name}
				color={editDialog.color}
				scope={editDialog.scope}
				familySize={
					editDialog.gate
						? getCopyFamilyIds(files, editDialog.gate.id).length
						: 0
				}
				subsampleName={
					subsamples.find(
						(s) =>
							s.id ===
							(editDialog.gate
								? findFileForGate(files, editDialog.gate.id)?.subsample
								: undefined),
					)?.name
				}
				error={editDialog.error}
				saving={editDialog.saving}
				onNameChange={editDialog.setName}
				onColorChange={editDialog.setColor}
				onScopeChange={editDialog.setScope}
				onSave={editDialog.confirm}
				onClose={editDialog.close}
			/>
		</>
	)
}
