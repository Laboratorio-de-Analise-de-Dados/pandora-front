import {
	Box,
	CircularProgress,
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
import {
	MdDelete as DeleteIcon,
	MdBarChart as StatsIcon,
	MdChevronLeft as PrevIcon,
	MdChevronRight as NextIcon,
	MdAccountTree as TreeIcon,
} from "react-icons/md"

function ExperimentPageContent() {
	const {
		experiment,
		experimentFiles,
		isLoading,
		source,
		setSource,
		fileStats,
		childGates,
		siblingGateNames,
		values,
		plotInitialConfig,
		setViewConfig,
		goToAdjacentFile,
		canGoPrevFile,
		canGoNextFile,
	} = useExperimentWorkspace()

	const {
		handleDelete,
		handleDeleteGate,
		handleRenameGate,
		handleApplyGate,
		handleConfirmApply,
		applyTarget,
		applyLoading,
		setApplyTarget,
	} = useExperimentPageActions()

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
					<Tooltip title="Excluir experimento">
						<IconButton onClick={handleDelete} color="error">
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				)}
			</Typography>
			<Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", mt: 1 }}>
				<ParentTree
					files={experimentFiles}
					onSelect={(s) => {
						setSource(s)
						if (isMobile) setShowTree(false)
					}}
					onDeleteGate={handleDeleteGate}
					onRenameGate={handleRenameGate}
					onApplyGate={handleApplyGate}
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
										parentId={
											source.type === "gate" ? source.id : undefined
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

			{applyTarget && (
				<ApplyGateDialog
					open={!!applyTarget}
					gateName={applyTarget.name}
					gateId={applyTarget.id}
					files={experimentFiles}
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
