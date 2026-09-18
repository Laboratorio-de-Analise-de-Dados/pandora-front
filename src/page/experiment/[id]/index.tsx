import {
	Box,
	Button,
	CircularProgress,
	Collapse,
	FormControlLabel,
	Paper,
	Switch,
	Typography,
	IconButton,
	Tooltip,
	useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
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
import {
	CompensationIndicator,
	CompensationPanel,
	useCompensationsQuery,
	useEmbeddedCompensationQuery,
} from "../../../features/compensation"
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
import type { UpdateExperimentPayload } from "../../../services/experimentService"

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
		saveSourceConfig,
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
	const {
		handleDisableFile,
		handleEnableFile,
		handleMoveFileToSubsample,
		handleUpdateFileTags,
	} = useFileActions()
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
		handleSetSubsampleControl,
	} = useSubsampleActions()

	const [editOpen, setEditOpen] = useState(false)
	const [editError, setEditError] = useState<string | null>(null)

	const handleSaveExperiment = async (payload: UpdateExperimentPayload) => {
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
	const [showCompensation, setShowCompensation] = useState(false)
	// Recorte do histórico (FE-27): o ícone junto do arquivo abre a timeline
	// filtrada por `fileDataId`; ações experiment-wide continuam inclusas.
	const [historyFileId, setHistoryFileId] = useState<number | undefined>(
		undefined,
	)

	const compensations = useCompensationsQuery(experiment?.id)
	const embeddedCompensation = useEmbeddedCompensationQuery(experiment?.id)
	const appliedCompensation = compensations.data?.find((m) => m.is_applied)
	const currentFile = experimentFiles.find((f) => f.id === source?.fileDataId)

	// Desktop: histórico/compensação são overlays sobre a área central —
	// árvore e stats continuam abertas ao lado. No mobile os sheets seguem
	// mutuamente exclusivos (um de cada vez).
	const openHistory = (fileId?: number) => {
		if (isMobile) {
			setShowStats(false)
			setShowTree(false)
		}
		setShowCompensation(false)
		setHistoryFileId(fileId)
		setShowHistory(true)
	}
	const closeHistory = () => setShowHistory(false)
	const openCompensation = () => {
		if (isMobile) {
			setShowStats(false)
			setShowTree(false)
		}
		setShowHistory(false)
		setShowCompensation(true)
	}
	const closeCompensation = () => setShowCompensation(false)
	const openStats = () => {
		if (isMobile) {
			setShowHistory(false)
			setShowCompensation(false)
			setShowTree(false)
		}
		setShowStats(true)
	}
	const openTree = () => {
		if (isMobile) {
			setShowStats(false)
			setShowHistory(false)
			setShowCompensation(false)
		}
		setShowTree(true)
	}

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
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					minWidth: 0,
					flexShrink: 0,
				}}
			>
				<Typography
					variant="subtitle1"
					fontWeight="bold"
					noWrap
					sx={{ minWidth: 0, color: "text.primary" }}
				>
					{experiment?.title}
				</Typography>
				{experiment && (
					<Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, ml: "auto" }}>
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
						{/* Histórico do experimento inteiro (timeline completa);
						    o recorte por amostra fica no sourceNav (FE-27). */}
						<Tooltip title="Histórico do experimento">
							<IconButton
								onClick={() =>
									showHistory && historyFileId === undefined
										? closeHistory()
										: openHistory()
								}
								sx={
									showHistory && historyFileId === undefined
										? { color: "primary.main" }
										: undefined
								}
							>
								<HistoryIcon fontSize="small" />
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
			</Box>
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
					onSetSubsampleControl={
						canEditExperiment ? handleSetSubsampleControl : undefined
					}
					onSaveFileTags={canEditExperiment ? handleUpdateFileTags : undefined}
					channels={values}
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

	// Seletor de amostra + navegação entre arquivos ("breadcrumb"). No
	// desktop fica no topo da coluna central; no mobile vai para a base,
	// junto dos controles, perto do polegar (FE-26).
	const sourceNav = !isLoading ? (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				gap: { xs: 0.5, md: 1 },
				width: "100%",
				px: { xs: 1, md: 2 },
				pt: { xs: 0.5, md: 1.5 },
				pb: { xs: 1, md: 0.5 },
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

			{/* Cluster de análise (FE-27): compensação + histórico do arquivo
			    atual, logo após a navegação entre amostras. */}
			<CompensationIndicator
				appliedName={appliedCompensation?.name ?? null}
				currentFileHasEmbedded={currentFile?.has_embedded_compensation === true}
				experimentHasEmbedded={
					embeddedCompensation.data != null ||
					experimentFiles.some((f) => f.has_embedded_compensation)
				}
				onClick={() =>
					showCompensation ? closeCompensation() : openCompensation()
				}
			/>
			<Tooltip title="Histórico desta amostra">
				<span>
					<IconButton
						size="small"
						disabled={!source}
						onClick={() =>
							showHistory ? closeHistory() : openHistory(source?.fileDataId)
						}
						sx={{ p: 0.5 }}
					>
						<HistoryIcon style={{ fontSize: 18 }} />
					</IconButton>
				</span>
			</Tooltip>

			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					ml: "auto",
					flexShrink: 0,
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
			</Box>
		</Box>
	) : null

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
				{/* Workspace no formato do mockup (FE-26): no desktop a árvore
				    e as stats são colunas fixas (in-flow) e o plot ocupa o centro;
				    no mobile tudo vira drawer/bottom sheet. */}
				<Box sx={{ display: "flex", height: "100%", width: "100%" }}>
					{/* Coluna esquerda: árvore de gates */}
					<CollapsiblePanel
						side="left"
						open={showTree}
						isMobile={isMobile}
						onOpen={openTree}
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

					{/* Coluna central: header fixado no topo (seletor de amostra +
					    navegação + ações) e área do plot centralizada no espaço
					    restante. */}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							flex: 1,
							minWidth: 0,
							height: "100%",
							position: "relative",
						}}
					>
						{!isMobile && sourceNav}

						{/* Área do plot: no desktop centralizada no espaço restante;
						    no mobile o gráfico ancora no topo (metade superior) e
						    os controles/seletor ficam na metade inferior (FE-26). */}
						<Box
							sx={{
								flex: 1,
								minHeight: 0,
								overflowY: "auto",
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: { xs: "flex-start", md: "center" },
								gap: "1rem",
								px: 1,
								// Respiro para os gatilhos flutuantes de Gates/Stats.
								pt: { xs: 12, md: 0 },
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
									onPersist={saveSourceConfig}
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

						{/* No mobile o seletor de amostra vive na base da coluna —
						    metade inferior junto dos controles do plot (FE-26). */}
						{isMobile && sourceNav}

						{/* Histórico e checkpoints (FE-25) no desktop: overlay que
						    desce do topo da área central, com rolagem interna —
						    árvore e estatísticas continuam visíveis ao lado. */}
						{!isMobile && (
							<Collapse
								in={showHistory}
								unmountOnExit
								sx={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									zIndex: 20,
								}}
							>
								<Paper
									sx={(theme) => ({
										maxHeight: "min(560px, 72vh)",
										overflowY: "auto",
										bgcolor: theme.palette.background.paper,
										border: `1px solid ${theme.palette.divider}`,
										borderTop: "none",
										borderRadius: "0 0 16px 16px",
										boxShadow: theme.shadows[8],
									})}
								>
									<HistoryPanel
										experimentId={experiment?.id}
										files={experimentFiles}
										canEdit={canEditExperiment}
										fileDataId={historyFileId}
										fileName={
											experimentFiles.find((f) => f.id === historyFileId)
												?.file_name
										}
										onClose={closeHistory}
									/>
								</Paper>
							</Collapse>
						)}
						{/* Compensação (FE-27): mesmo overlay do histórico. */}
						{!isMobile && (
							<Collapse
								in={showCompensation}
								unmountOnExit
								sx={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									zIndex: 20,
								}}
							>
								<Paper
									sx={(theme) => ({
										maxHeight: "min(560px, 72vh)",
										overflowY: "auto",
										bgcolor: theme.palette.background.paper,
										border: `1px solid ${theme.palette.divider}`,
										borderTop: "none",
										borderRadius: "0 0 16px 16px",
										boxShadow: theme.shadows[8],
									})}
								>
									<CompensationPanel
										experimentId={experiment?.id}
										canEdit={canEditExperiment}
										onClose={closeCompensation}
									/>
								</Paper>
							</Collapse>
						)}
					</Box>

					{/* Coluna direita: estatísticas */}
					<CollapsiblePanel
						side="right"
						open={showStats}
						isMobile={isMobile}
						onOpen={openStats}
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

					{/* Histórico no mobile: bottom sheet exclusivo (desktop usa o
					    overlay sobre a área central, acima). */}
					{isMobile && (
						<CollapsiblePanel
							side="right"
							open={showHistory}
							isMobile={isMobile}
							onOpen={openHistory}
							onClose={closeHistory}
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
								fileDataId={historyFileId}
								fileName={
									experimentFiles.find((f) => f.id === historyFileId)?.file_name
								}
								onClose={closeHistory}
							/>
						</CollapsiblePanel>
					)}

					{/* Compensação no mobile: bottom sheet exclusivo. */}
					{isMobile && (
						<CollapsiblePanel
							side="right"
							open={showCompensation}
							isMobile={isMobile}
							onOpen={openCompensation}
							onClose={closeCompensation}
							label="Compensação"
							icon={<BoltIcon style={{ fontSize: 18 }} />}
							desktopWidth="26%"
							desktopMinWidth={320}
							mobileAnchor="bottom"
							hideTrigger
						>
							<CompensationPanel
								experimentId={experiment?.id}
								canEdit={canEditExperiment}
								onClose={closeCompensation}
							/>
						</CollapsiblePanel>
					)}
				</Box>
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
