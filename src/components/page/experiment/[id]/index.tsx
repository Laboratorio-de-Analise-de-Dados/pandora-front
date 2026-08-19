import {
	Box,
	CircularProgress,
	Typography,
	IconButton,
	Tooltip,
	useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
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
		<Box sx={{ p: 1, height: "100%", overflowY: "auto" }}>
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
	)

	const configTabContent = source ? (
		<PlotConfigPanel onAdjustingChange={setIsConfigAdjusting} />
	) : (
		<Box sx={{ p: 2 }}>
			<Typography variant="body2" color="text.secondary">
				Selecione um arquivo ou gate para ajustar as configurações do
				gráfico.
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

	const sidePanelTabs = [
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
			content: configTabContent,
		},
		{
			id: "stats",
			label: "Estatísticas",
			icon: <StatsIcon size={18} />,
			content: statsTabContent,
		},
	]

	return (
		<Layout>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100vh",
					overflow: "hidden",
				}}
			>
				{/* Barra superior: título do experimento + seletor de fonte */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 1.5,
						flexWrap: "wrap",
						px: { xs: 2, md: 3 },
						py: 1.5,
						borderBottom: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.background.paper,
						zIndex: 30,
					}}
				>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
						<Typography variant="h6" fontWeight="bold" noWrap>
							{experiment?.title ?? "Experimento"}
						</Typography>
						{experiment && (
							<Tooltip title="Excluir experimento">
								<IconButton onClick={handleDelete} color="error" size="small">
									<DeleteIcon size={20} />
								</IconButton>
							</Tooltip>
						)}
					</Box>

					{experimentFiles.length > 0 && (
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
				</Box>

				{/* Área de trabalho: gráfico central + painel lateral */}
				<Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
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

					{!isLoading && !source && (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
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
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "flex-start",
									width: "100%",
									height: "100%",
									overflowY: "auto",
									gap: "1rem",
									py: 2,
								}}
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
							</Box>

							<ExperimentSidePanel
								isMobile={isMobile}
								open={sidePanelOpen}
								activeTab={activeTab}
								onOpen={() => setSidePanelOpen(true)}
								onClose={() => setSidePanelOpen(false)}
								onTabChange={setActiveTab}
								transparent={
									isMobile && activeTab === "config" && isConfigAdjusting
								}
								tabs={sidePanelTabs}
							/>
						</PlotStateProvider>
					)}

					{!isLoading && !source && (
						<ExperimentSidePanel
							isMobile={isMobile}
							open={sidePanelOpen}
							activeTab={activeTab}
							onOpen={() => setSidePanelOpen(true)}
							onClose={() => setSidePanelOpen(false)}
							onTabChange={setActiveTab}
							tabs={sidePanelTabs}
						/>
					)}
				</Box>
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
