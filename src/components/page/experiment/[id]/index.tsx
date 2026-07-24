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
import { toast } from "react-toastify"
import CytometryApi from "../../../../API"
import { findGateInTree } from "../../../../features/gate/utils"
import {
	ExperimentWorkspaceProvider,
	useExperimentWorkspace,
} from "../../../../features/experiment/context/ExperimentWorkspaceContext"
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
import { useNavigate } from "react-router-dom"

function ExperimentPageContent() {
	const {
		experiment,
		experimentFiles,
		isLoading,
		source,
		setSource,
		fileStats,
		invalidateExperiment,
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

	const navigate = useNavigate()
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down("md"))
	const [showStats, setShowStats] = useState(() => !isMobile)
	const [showTree, setShowTree] = useState(() => !isMobile)
	const [applyTarget, setApplyTarget] = useState<{
		id: number
		name: string
		fileDataId: number
	} | null>(null)
	const [applyLoading, setApplyLoading] = useState(false)

	const handleDelete = async (id: number) => {
		const confirmed = window.confirm("Tem certeza que deseja excluir?")
		if (!confirmed) return
		try {
			await CytometryApi.delete(`/experiment/${id}`)
			toast.success("Experimento excluído com sucesso!", {
				position: "bottom-right",
			})
			navigate(`/experiments`)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao excluir o experimento: ${errorMessage}`, {
				position: "bottom-right",
			})
		}
	}

	const handleDeleteGate = async (gateId: number) => {
		try {
			await CytometryApi.delete(`/analytics/gate/${gateId}`)
			toast.success("Gate excluído com sucesso!", { position: "bottom-right" })
			if (source?.type === "gate" && source.id === gateId) {
				setSource(undefined)
			}
			invalidateExperiment()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao excluir o gate: ${errorMessage}`, {
				position: "bottom-right",
			})
		}
	}

	const handleApplyGate = (gateId: number, gateName: string) => {
		let fileDataId = 0
		for (const file of experimentFiles) {
			if (findGateInTree(file.gates, gateId)) {
				fileDataId = file.id
				break
			}
		}
		setApplyTarget({ id: gateId, name: gateName, fileDataId })
	}

	const handleConfirmApply = async (
		targetFileDataIds: number[],
		recursive: boolean,
	) => {
		if (!applyTarget) return
		setApplyLoading(true)
		try {
			await CytometryApi.post("/analytics/gate/apply", {
				source_gate_ids: [applyTarget.id],
				target_file_data_ids: targetFileDataIds,
				recursive,
				on_conflict: "replace",
			})
			toast.success("Gates aplicados com sucesso!", {
				position: "bottom-right",
			})
			setApplyTarget(null)
			invalidateExperiment()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao aplicar gates: ${errorMessage}`, {
				position: "bottom-right",
			})
		} finally {
			setApplyLoading(false)
		}
	}

	const handleRenameGate = async (gateId: number, newName: string) => {
		try {
			await CytometryApi.patch(`/analytics/gate/${gateId}`, { name: newName })
			toast.success("Gate renomeado com sucesso!", { position: "bottom-right" })
			invalidateExperiment()
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao renomear o gate: ${errorMessage}`, {
				position: "bottom-right",
			})
		}
	}

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
						<IconButton
							onClick={() => handleDelete(experiment.id)}
							color="error"
						>
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
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "flex-start", // mantém tudo no topo
					alignItems: "center",
					flex: 2,
					minWidth: 0,
					height: "100vh", // garante que ocupe toda a altura da tela
					overflowY: "auto", // permite rolagem se necessário
					gap: "1rem",
				}}
			>
				{isLoading && <CircularProgress />}
				{!isLoading && !source && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100%", // ocupa toda a altura disponível
						}}
					>
						<Typography>Select a file to load</Typography>
					</Box>
				)}
				{source && (
					<>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Tooltip title={showTree ? "Esconder árvore" : "Mostrar árvore"}>
								<IconButton
									size="small"
									color={showTree ? "primary" : "default"}
									onClick={() => setShowTree((p) => !p)}
								>
									<TreeIcon />
								</IconButton>
							</Tooltip>
							<Tooltip title="Arquivo anterior">
								<span>
									<IconButton
										size="small"
										disabled={!canGoPrevFile}
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
										disabled={!canGoNextFile}
										onClick={() => goToAdjacentFile(1)}
									>
										<NextIcon />
									</IconButton>
								</span>
							</Tooltip>
							<Tooltip
								title={
									showStats ? "Esconder estatísticas" : "Mostrar estatísticas"
								}
							>
								<IconButton
									size="small"
									color={showStats ? "primary" : "default"}
									onClick={() => setShowStats((p) => !p)}
								>
									<StatsIcon />
								</IconButton>
							</Tooltip>
						</Box>
						<ScatterPlot
							key={`${source.type}-${source.id}`}
							values={values}
							sourceType={source.type}
							sourceId={source.id}
							fileDataId={source.fileDataId}
							parentId={source.type === "gate" ? source.id : undefined}
							loadFile={invalidateExperiment}
							siblingGateNames={siblingGateNames}
							childGates={childGates}
							initialConfig={selectedGate?.plot_config}
							carryForwardConfig={viewConfig}
							onConfigChange={setViewConfig}
						/>
					</>
				)}
			</Box>
			{/* Mobile: estatísticas sobem por cima do gráfico (bottom sheet) */}
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
			>
				<StatsPanel
					source={source}
					files={experimentFiles}
					values={values}
					fileStats={fileStats}
					onClose={() => setShowStats(false)}
				/>
			</CollapsiblePanel>
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
