import {
	Box,
	CircularProgress,
	Typography,
	IconButton,
	Tooltip,
	useMediaQuery,
} from "@mui/material"
import { Theme, useTheme } from "@mui/material/styles"
import { useEffect, useState } from "react"
import Layout from "../../../Layout"
import {
	ExperimentWorkspaceProvider,
	useExperimentWorkspace,
} from "../../../../features/experiment/context/ExperimentWorkspaceContext"
import { useExperimentPageActions } from "../../../../features/experiment/hooks/useExperimentPageActions"
import { PlotStateProvider } from "../../../../features/plot/context/PlotStateContext"
import PlotConfigPanel from "../../../../features/plot/components/PlotConfigPanel"
import ExperimentSidePanel from "../../../../features/experiment/components/ExperimentSidePanel"
import ScatterPlot from "../../../plotly"
import ParentTree from "../../../parent_tree"
import SourceDropdown from "../../../../features/experiment/components/SourceDropdown"
import StatsPanel from "../../../stats_panel"
import ApplyGateDialog from "../../../apply_gate_dialog"
import {
	MdDelete as DeleteIcon,
	MdChevronLeft as PrevIcon,
	MdChevronRight as NextIcon,
	MdAccountTree as TreeIcon,
	MdSettings as ConfigIcon,
	MdBarChart as StatsIcon,
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
		selectedGate,
		viewConfig,
		setViewConfig,
		goToAdjacentFile,
		canGoPrevFile,
		canGoNextFile,
	} = useExperimentWorkspace()

	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down("md"))
	const [sidePanelOpen, setSidePanelOpen] = useState(() => !isMobile)
	const [activeTab, setActiveTab] = useState("gates")
	const [isConfigAdjusting, setIsConfigAdjusting] = useState(false)

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

	useEffect(() => {
		setSidePanelOpen(!isMobile)
	}, [isMobile])

	useEffect(() => {
		if (activeTab !== "config") setIsConfigAdjusting(false)
	}, [activeTab])

	useEffect(() => {
		if (!sidePanelOpen) setIsConfigAdjusting(false)
	}, [sidePanelOpen])

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
							<DeleteIcon size="1.25rem" />
						</IconButton>
					</Tooltip>
				)}
			</Typography>
			<Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", mt: 1 }}>
				<ParentTree
					files={experimentFiles}
					onSelect={(s) => {
						setSource(s)
						if (isMobile) setSidePanelOpen(false)
					}}
					onDeleteGate={handleDeleteGate}
					onRenameGate={handleRenameGate}
					onApplyGate={handleApplyGate}
				/>
			</Box>
		</>
	)

	const configPlaceholder = (
		<Box sx={{ p: 2 }}>
			<Typography variant="body2" color="text.secondary">
				Selecione um arquivo ou gate para ajustar as configurações do gráfico.
			</Typography>
		</Box>
	)

	const statsTabContent = (
		<StatsPanel
			source={source}
			files={experimentFiles}
			values={values}
			fileStats={fileStats}
		/>
	)

	const renderSidePanel = (configContent: React.ReactNode) => (
		<ExperimentSidePanel
			isMobile={isMobile}
			open={sidePanelOpen}
			activeTab={activeTab}
			onOpen={() => setSidePanelOpen(true)}
			onClose={() => setSidePanelOpen(false)}
			onTabChange={setActiveTab}
			transparent={isMobile && activeTab === "config" && isConfigAdjusting}
			tabs={[
				{
					id: "gates",
					label: "Gates",
					icon: <TreeIcon size={18} />,
					content: treeContent,
				},
				{
					id: "config",
					label: "Config",
					icon: <ConfigIcon size={18} />,
					content: configContent,
				},
				{
					id: "stats",
					label: "Estatísticas",
					icon: <StatsIcon size={18} />,
					content: statsTabContent,
				},
			]}
		/>
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
				{/* Área central entre header e footer: seletor + gráfico */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "flex-start",
						alignItems: "center",
						width: "100%",
						height: "100%",
						overflowY: "auto",
						gap: "1rem",
					}}
				>
					{isLoading && (
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
					)}

					{!isLoading && (
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
					)}

					{!isLoading && !source && (
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

					{!isLoading && source && (
						<PlotStateProvider
							key={`${source.type}-${source.id}`}
							sourceType={source.type}
							sourceId={source.id}
							initialConfig={{
								...viewConfig,
								...selectedGate?.plot_config,
							}}
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
							{renderSidePanel(
								<PlotConfigPanel onAdjustingChange={setIsConfigAdjusting} />,
							)}
						</PlotStateProvider>
					)}
				</Box>

				{/* Painel lateral esquerdo: Gates/Config/Estatísticas (overlay) */}
				{!isLoading && !source && renderSidePanel(configPlaceholder)}
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
