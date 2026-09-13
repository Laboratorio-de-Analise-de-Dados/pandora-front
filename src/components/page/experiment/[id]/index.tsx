import {
	Box,
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
import Layout from "../../../Layout"
import {
	ExperimentWorkspaceProvider,
	useExperimentWorkspace,
} from "../../../../features/experiment/context/ExperimentWorkspaceContext"
import { useExperimentPageActions } from "../../../../features/experiment/hooks/useExperimentPageActions"
import { PlotStateProvider } from "../../../../features/plot/context/PlotStateContext"
import ScatterPlot from "../../../plotly"
import ParentTree from "../../../parent_tree"
import SourceDropdown from "../../../../features/experiment/components/SourceDropdown"
import CollapsiblePanel from "../../../../features/experiment/components/CollapsiblePanel"
import StatsPanel from "../../../stats_panel"
import ApplyGateDialog from "../../../apply_gate_dialog"
import ApplyConflictDialog from "../../../apply_gate_dialog/components/ApplyConflictDialog"
import EditExperimentDialog from "../../../../features/experiment/components/EditExperimentDialog"
import DeleteGateDialog from "../../../delete_gate_dialog"
import {
	MdDelete as DeleteIcon,
	MdEdit as EditIcon,
	MdBarChart as StatsIcon,
	MdChevronLeft as PrevIcon,
	MdChevronRight as NextIcon,
	MdAccountTree as TreeIcon,
	MdUploadFile as UploadIcon,
	MdDownload as DownloadIcon,
} from "react-icons/md"
import { ACCEPTED_EXPERIMENT_FILE_ACCEPT } from "../../../../utils/experimentFile"

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
		handleRequestDeleteGate,
		handleConfirmDeleteGate,
		deleteGateTarget,
		deleteGateLoading,
		deleteGateError,
		setDeleteGateTarget,
		handleRenameGate,
		handleDisableFile,
		handleEnableFile,
		handleCreateSubsample,
		handleRenameSubsample,
		handleArchiveSubsample,
		handleMoveFileToSubsample,
		handleApplyGate,
		handleConfirmApply,
		handleUpdateExperiment,
		savingExperiment,
		canEditExperiment,
		handleAddFile,
		addingFile,
		handleDownload,
		applyTarget,
		applyLoading,
		setApplyTarget,
		applyConflicts,
		handleResolveApplyConflicts,
	} = useExperimentPageActions()

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

	const treeContent = (
		<>
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
								<Tooltip title="Excluir experimento">
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
					onSelect={(s) => {
						setSource(s)
						if (isMobile) setShowTree(false)
					}}
					onDeleteGate={handleRequestDeleteGate}
					onRenameGate={handleRenameGate}
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
		</>
	)

	return (
		<Layout>
			<Box
				sx={{
					position: "relative",
					flex: 1,
					minWidth: 0,
					height: "100vh",
					overflow: "hidden",
				}}
			>
				{/* Área central: seletor sempre visível + gráfico centralizado */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						alignItems: "center",
						width: "100%",
						height: "100%",
						overflowY: "auto",
						gap: "1rem",
						pt: { xs: 2, md: 3 },
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
					) : (
						<>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
								<SourceDropdown
									files={experimentFiles}
									source={source}
									onSelect={setSource}
								/>
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
							</Box>

							{sourceLabel && (
								<Typography
									variant="subtitle2"
									fontWeight="bold"
									textAlign="center"
									sx={{
										px: 1,
										maxWidth: "100%",
										wordBreak: "break-word",
										fontSize: { xs: "0.8rem", md: "0.9rem" },
									}}
								>
									{sourceLabel}
								</Typography>
							)}

							{source ? (
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
								<Box
									sx={{
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
										flex: 1,
										width: "100%",
									}}
								>
									<Typography>Select a file to load</Typography>
								</Box>
							)}
						</>
					)}
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
					sourceFileDataId={applyTarget.fileDataId}
					onClose={() => setApplyTarget(null)}
					onApply={handleConfirmApply}
					loading={applyLoading}
				/>
			)}

			<ApplyConflictDialog
				conflicts={applyConflicts}
				loading={applyLoading}
				onResolve={handleResolveApplyConflicts}
			/>
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
