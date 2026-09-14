import {
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
	MdDriveFileMove as TransferIcon,
	MdVisibilityOff as DisableIcon,
	MdRestoreFromTrash as EnableIcon,
	MdCreateNewFolder as NewSubsampleIcon,
	MdSelectAll as SelectAllIcon,
	MdInfoOutline as InfoIcon,
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
} from "@mui/material"
import { useMemo } from "react"
import type {
	ExperimentFiles,
	SelectedSource,
	Subsample,
} from "../../../../types"
import {
	groupFilesBySubsample,
	hasSubsampleLevel,
} from "../../utils/groupBySubsample"
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
	SubsampleFormDialog,
} from "./dialogs"

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
}: {
	files: ExperimentFiles[]
	subsamples?: Subsample[]
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
}) {
	const {
		handlers,
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
	})

	const groups = useMemo(
		() => groupFilesBySubsample(files, subsamples),
		[files, subsamples],
	)
	const grouped = hasSubsampleLevel(groups)

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
			<Box
				role="tree"
				sx={(theme) => ({
					flexGrow: 1,
					overflowY: "auto",
					color: theme.palette.text.primary,
				})}
			>
				{grouped
					? groups.map((group) => (
							<SubsampleGroupItem
								key={
									group.subsampleId !== null
										? `subsample-${group.subsampleId}`
										: "subsample-none"
								}
								group={group}
								handlers={handlers}
							/>
						))
					: files.map((file) => (
							<FileTreeItem
								key={`file-${file.id}`}
								file={file}
								depth={0}
								handlers={handlers}
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
			/>

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
