import {
	Box,
	Button,
	CircularProgress,
	FormControlLabel,
	Switch,
	Typography,
	IconButton,
	Tooltip,
	useMediaQuery,
} from "@mui/material"
import { Theme, useTheme } from "@mui/material/styles"
import { useState } from "react"
import Layout from "../../../components/Layout"
import {
	ExperimentWorkspaceProvider,
	useExperimentWorkspace,
} from "../../../features/experiment/context/ExperimentWorkspaceContext"
import { useExperimentMetaActions } from "../../../features/experiment/hooks/useExperimentMetaActions"
import { useFileActions } from "../../../features/experiment/hooks/useFileActions"
import { useGateActions } from "../../../features/experiment/hooks/useGateActions"
import { useSubsampleActions } from "../../../features/experiment/hooks/useSubsampleActions"
import { PlotStateProvider } from "../../../features/plot/context/PlotStateContext"
import ScatterPlot from "../../../features/plot/components/scatter-plot"
import ParentTree from "../../../features/experiment/components/parent-tree"
import SourceDropdown from "../../../features/experiment/components/SourceDropdown"
import CollapsiblePanel from "../../../features/experiment/components/CollapsiblePanel"
import StatsPanel from "../../../features/stats/components/StatsPanel"
import HistoryPanel from "../../../features/history/components/HistoryPanel"
import ApplyGateDialog from "../../../features/gate/components/apply-gate-dialog"
import EditExperimentDialog from "../../../features/experiment/components/EditExperimentDialog"
import DeleteGateDialog from "../../../features/gate/components/delete-gate-dialog"
import {
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
	MdBarChart as StatsIcon,
	MdChevronLeft as PrevIcon,
	MdChevronRight as NextIcon,
	MdAccountTree as TreeIcon,
	MdUploadFile as UploadIcon,
	MdDownload as DownloadIcon,
	MdHistory as HistoryIcon,
	MdFlashOn as BoltIcon,
} from "react-icons/md"
import { ACCEPTED_EXPERIMENT_FILE_ACCEPT } from "../../../utils/experimentFile"

function ExperimentPageContent() {
	const {
		experiment,
		experimentFiles,
		subsamples,
		isLoading,
		source,
		setSource,
		fileStats,
		childGates,
		siblingGateNames,
		selectedGate,
		values,
		plotInitialConfig,
		sourceLabel,
		setViewConfig,
		goToAdjacentFile,
		canGoPrevFile,
		canGoNextFile,
		showInactiveFiles,
		setShowInactiveFiles,
	} = useExperimentWorkspace()

	const {
		handleDelete,
		handleAddFile,
		addingFile,
		handleDownload,
		handleUpdateExperiment,
		savingExperiment,
		canEditExperiment,
	} = useExperimentMetaActions()
	const { handleDisableFile, handleEnableFile, handleMoveFileToSubsample } =
		useFileActions()
	const {
		handleRequestDeleteGate,
		handleConfirmDeleteGate,
		deleteGateTarget,
		deleteGateLoading,
		deleteGateError,
		setDeleteGateTarget,
		handleEditGate,
		handleApplyGate,
		handleConfirmApply,
		applyTarget,
		applyLoading,
		setApplyTarget,
	} = useGateActions()
	const {
		handleCreateSubsample,
		handleRenameSubsample,
		handleArchiveSubsample,
	} = useSubsampleActions()

	const [editOpen, setEditOpen] = useState(false)
	const [editError, setEditError] = useState<string | null>(null)

	const handleSaveExperiment = async (payload: {
		title: string
		type: string
		values: string[]
	}) => {
		const error = await handleUpdateExperiment(payload)
		if (error) {
			setEditError(error)
			return
		}
		setEditOpen(false)
	}

	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down("md"))
	const [showStats, setShowStats] = useState(() => !isMobile)
	const [showTree, setShowTree] = useState(() => !isMobile)
	const [showHistory, setShowHistory] = useState(false)

	const treeContent = (
		<>
			{/* Handle do bottom sheet no mobile (FE-26). */}
			{isMobile && (
				<Box
					sx={{
						width: 40,
						height: 4,
						borderRadius: 2,
						bgcolor: "divider",
						mx: "auto",
						mb: 1,
						flexShrink: 0,
					}}
				/>
			)}
			<Typography
				sx={(theme: Theme) => ({
					color: theme.palette.text.primary,
					flexShrink: 0,
				})}
				variant="h5"
				fontWeight="bold"
				display="flex"
				alignItems="center"
				gap="2rem"
			>
				{experiment?.title}
				{experiment && (
					<Box sx={{ display: "flex", gap: 0.5 }}>
						{canEditExperiment && (
							<Tooltip title="Adicionar arquivos (.zip ou .fcs)">
								<span>
									<IconButton component="label" disabled={addingFile}>
										{addingFile ? (
											<CircularProgress size={18} />
										) : (
											<UploadIcon fontSize="small" />
										)}
										<input
											type="file"
											accept={ACCEPTED_EXPERIMENT_FILE_ACCEPT}
											hidden
											onChange={(e) => {
												const selected = e.target.files?.[0]
												e.target.value = ""
												if (selected) void handleAddFile(selected)
											}}
										/>
									</IconButton>
								</span>
							</Tooltip>
						)}
						<Tooltip title="Baixar dados (ZIP por subsample)">
							<IconButton onClick={handleDownload}>
								<DownloadIcon fontSize="small" />
							</IconButton>
						</Tooltip>
						{canEditExperiment && (
							<>
								<Tooltip title="Editar experimento">
									<IconButton
										onClick={() => {
											setEditError(null)
											setEditOpen(true)
										}}
									>
										<EditIcon fontSize="small" />
									</IconButton>
								</Tooltip>
								<Tooltip title="Desativar experimento">
									<IconButton onClick={handleDelete} color="error">
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							</>
						)}
					</Box>
				)}
			</Typography>
			<FormControlLabel
				control={
					<Switch
						size="small"
						checked={showInactiveFiles}
						onChange={(e) => setShowInactiveFiles(e.target.checked)}
					/>
				}
				label={<Typography variant="caption">Mostrar desabilitadas</Typography>}
				sx={{ flexShrink: 0, mt: 0.5 }}
			/>
			<Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", mt: 1 }}>
				<ParentTree
					files={experimentFiles}
					subsamples={subsamples}
					source={source}
					onSelect={(s) => {
						setSource(s)
						if (isMobile) setShowTree(false)
					}}
					onDeleteGate={handleRequestDeleteGate}
					onEditGate={handleEditGate}
					onApplyGate={handleApplyGate}
					onDisableFile={handleDisableFile}
					onEnableFile={handleEnableFile}
					onCreateSubsample={
						canEditExperiment ? handleCreateSubsample : undefined
					}
					onRenameSubsample={
						canEditExperiment ? handleRenameSubsample : undefined
					}
					onArchiveSubsample={
						canEditExperiment ? handleArchiveSubsample : undefined
					}
					onMoveFile={canEditExperiment ? handleMoveFileToSubsample : undefined}
				/>
			</Box>
			{/* Ação principal do sheet no mobile (FE-26): propagação do gate
			    selecionado, full-width no rodapé como no mockup. */}
			{isMobile && source?.type === "gate" && canEditExperiment && (
				<Button
					variant="contained"
					fullWidth
					startIcon={<BoltIcon />}
					sx={{ mt: 1, flexShrink: 0 }}
					onClick={() => handleApplyGate(source.id, selectedGate?.name ?? "")}
				>
					Propagar Gate
				</Button>
			)}
		</>
	)

	return (
		<Layout>
			<Box
				sx={{
					position: "relative",
					flex: 1,
					minWidth: 0,
					// Viewport menos a barra fina do topo (Toolbar dense = 48px).
					height: "calc(100dvh - 48px)",
					overflow: "hidden",
				}}
			>
				{/* Coluna do workspace: header fixado no topo (seletor de
				    amostra + navegação + ações) e área do plot centralizada
				    no espaço restante — como no mockup (FE-26). */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						width: "100%",
						height: "100%",
					}}
				>
					{!isLoading && (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: { xs: 0.5, md: 1 },
								width: "100%",
								px: { xs: 1, md: 2 },
								pt: { xs: 1, md: 1.5 },
								pb: 0.5,
								flexShrink: 0,
							}}
						>
							<SourceDropdown
								files={experimentFiles}
								source={source}
								onSelect={setSource}
							/>
							<Tooltip title="Arquivo anterior">
								<span>
									<IconButton
										size="small"
										disabled={!source || !canGoPrevFile}
										onClick={() => goToAdjacentFile(-1)}
									>
										<PrevIcon />
									</IconButton>
								</span>
							</Tooltip>
							<Tooltip title="Próximo arquivo">
								<span>
									<IconButton
										size="small"
										disabled={!source || !canGoNextFile}
										onClick={() => goToAdjacentFile(1)}
									>
										<NextIcon />
									</IconButton>
								</span>
							</Tooltip>

							{sourceLabel && (
								<Typography
									variant="subtitle2"
									fontWeight="bold"
									color="text.secondary"
									sx={{
										flex: 1,
										textAlign: "center",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										px: 1,
										fontSize: { xs: "0.75rem", md: "0.85rem" },
									}}
								>
									{sourceLabel}
								</Typography>
							)}

							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 0.5,
									ml: "auto",
								}}
							>
								{/* Propagar Gate: botão verde no header (desktop);
									    no mobile fica no rodapé do sheet da árvore. */}
								{!isMobile && source?.type === "gate" && canEditExperiment && (
									<Tooltip title="Aplicar este gate em outras amostras">
										<Button
											variant="contained"
											size="small"
											startIcon={<BoltIcon />}
											onClick={() =>
												handleApplyGate(source.id, selectedGate?.name ?? "")
											}
										>
											Propagar Gate
										</Button>
									</Tooltip>
								)}
								<Tooltip title="Histórico e checkpoints">
									<IconButton size="small" onClick={() => setShowHistory(true)}>
										<HistoryIcon />
									</IconButton>
								</Tooltip>
							</Box>
						</Box>
					)}

					{/* Área do plot: centralizada no espaço que sobra abaixo
					    do header. */}
					<Box
						sx={{
							flex: 1,
							minHeight: 0,
							overflowY: "auto",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							gap: "1rem",
							px: 1,
							pb: { xs: 2, md: 3 },
						}}
					>
						{isLoading ? (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									height: "100%",
								}}
							>
								<CircularProgress />
							</Box>
						) : source ? (
							<PlotStateProvider
								key={`${source.type}-${source.id}`}
								sourceType={source.type}
								sourceId={source.id}
								initialConfig={plotInitialConfig}
								onPersist={setViewConfig}
							>
								<ScatterPlot
									values={values}
									sourceType={source.type}
									sourceId={source.id}
									fileDataId={source.fileDataId}
									parentId={source.type === "gate" ? source.id : undefined}
									parentName={
										source.type === "gate" ? selectedGate?.name : undefined
									}
									siblingGateNames={siblingGateNames}
									childGates={childGates}
								/>
							</PlotStateProvider>
						) : (
							<Typography>Select a file to load</Typography>
						)}
					</Box>
				</Box>

				{/* Overlay esquerdo: árvore de gates */}
				<CollapsiblePanel
					side="left"
					open={showTree}
					isMobile={isMobile}
					onOpen={() => setShowTree(true)}
					onClose={() => setShowTree(false)}
					label="Gates"
					icon={<TreeIcon style={{ fontSize: 18 }} />}
					desktopWidth="20%"
					contentPadding="1rem"
					mobileAnchor="bottom"
					mobileTriggerTop={56}
					paperSx={{
						display: "flex",
						flexDirection: "column",
						p: 2,
						overflow: "hidden",
					}}
				>
					{treeContent}
				</CollapsiblePanel>

				{/* Overlay direito: estatísticas */}
				<CollapsiblePanel
					side="right"
					open={showStats}
					isMobile={isMobile}
					onOpen={() => setShowStats(true)}
					onClose={() => setShowStats(false)}
					label="Estatísticas"
					icon={<StatsIcon style={{ fontSize: 18 }} />}
					desktopWidth="22%"
					desktopMinWidth={260}
					mobileAnchor="bottom"
					mobileTriggerTop={56}
					contentPadding="1rem"
				>
					<StatsPanel
						source={source}
						files={experimentFiles}
						values={values}
						fileStats={fileStats}
						onClose={() => setShowStats(false)}
					/>
				</CollapsiblePanel>

				{/* Overlay direito: histórico e checkpoints (FE-25). Sem aba
				    própria — abre pelo ícone no header do workspace; no mobile
				    vira bottom sheet. Sobrepõe o painel de estatísticas. */}
				<CollapsiblePanel
					side="right"
					open={showHistory}
					isMobile={isMobile}
					onOpen={() => setShowHistory(true)}
					onClose={() => setShowHistory(false)}
					label="Histórico"
					icon={<HistoryIcon style={{ fontSize: 18 }} />}
					desktopWidth="26%"
					desktopMinWidth={320}
					mobileAnchor="bottom"
					hideTrigger
				>
					<HistoryPanel
						experimentId={experiment?.id}
						files={experimentFiles}
						canEdit={canEditExperiment}
						onClose={() => setShowHistory(false)}
					/>
				</CollapsiblePanel>
			</Box>

			{experiment && (
				<EditExperimentDialog
					open={editOpen}
					experiment={experiment}
					saving={savingExperiment}
					error={editError}
					onClose={() => setEditOpen(false)}
					onSave={handleSaveExperiment}
				/>
			)}

			{deleteGateTarget && (
				<DeleteGateDialog
					open={!!deleteGateTarget}
					target={deleteGateTarget}
					files={experimentFiles}
					subsamples={subsamples}
					error={deleteGateError}
					loading={deleteGateLoading}
					onClose={() => setDeleteGateTarget(null)}
					onConfirm={handleConfirmDeleteGate}
				/>
			)}

			{applyTarget && (
				<ApplyGateDialog
					open={!!applyTarget}
					gateName={applyTarget.name}
					gateId={applyTarget.id}
					files={experimentFiles.filter((f) => f.active !== false)}
					subsamples={subsamples}
					sourceFileDataId={applyTarget.fileDataId}
					onClose={() => setApplyTarget(null)}
					onApply={handleConfirmApply}
					loading={applyLoading}
				/>
			)}
		</Layout>
	)
}

export default function ExperimentPage() {
	return (
		<ExperimentWorkspaceProvider>
			<ExperimentPageContent />
		</ExperimentWorkspaceProvider>
	)
}
