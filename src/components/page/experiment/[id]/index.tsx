import { Box, CircularProgress, Typography } from "@mui/material"
import { useState } from "react"
import Layout from "../../../Layout"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CytometryApi from "../../../../API"
import { getChildGatesForSource, findGateInTree } from "../../../../features/gate/utils"
import {
	useExperimentQuery,
	useExperimentFilesQuery,
	useFileStatsQuery,
	useInvalidateExperiment,
} from "../../../../features/experiment/hooks/useExperimentData"
import ScatterPlot from "../../../plotly"
import ParentTree, { SelectedSource } from "../../../parent_tree"
import StatsPanel from "../../../stats_panel"
import ApplyGateDialog from "../../../apply_gate_dialog"
import { MdDelete as DeleteIcon, MdBarChart as StatsIcon } from "react-icons/md"
import { IconButton, Tooltip } from "@mui/material"
import { useHistory } from "react-router-dom"

interface Params {
	id: string
}

export default function ExperimentPage() {
	const param = useParams<Params>()
	const router = useHistory()

	const { data: experiment, isLoading } = useExperimentQuery(param.id)
	const { data: experimentFiles = [] } = useExperimentFilesQuery(param.id)
	const invalidateExperiment = useInvalidateExperiment(param.id)

	const [source, setSource] = useState<SelectedSource | undefined>(undefined)
	const [showStats, setShowStats] = useState(true)
	const [applyTarget, setApplyTarget] = useState<{ id: number; name: string; fileDataId: number } | null>(null)
	const [applyLoading, setApplyLoading] = useState(false)

	const { data: fileStats } = useFileStatsQuery(source?.type, source?.id)

	const childGates = getChildGatesForSource(experimentFiles, source)
	const siblingGateNames = childGates.map((g) => g.name)

	const handleDelete = async (id: number) => {
		const confirmed = window.confirm("Tem certeza que deseja excluir?")
		if (!confirmed) return
		try {
			await CytometryApi.delete(`/experiment/${id}`)
			toast.success("Experimento excluído com sucesso!", { position: "bottom-right" })
			router.push(`/experiments`)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao excluir o experimento: ${errorMessage}`, { position: "bottom-right" })
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
			const errorMessage = error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao excluir o gate: ${errorMessage}`, { position: "bottom-right" })
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

	const handleConfirmApply = async (targetFileDataIds: number[], recursive: boolean) => {
		if (!applyTarget) return
		setApplyLoading(true)
		try {
			await CytometryApi.post("/analytics/gate/apply", {
				source_gate_ids: [applyTarget.id],
				target_file_data_ids: targetFileDataIds,
				recursive,
				on_conflict: "replace",
			})
			toast.success("Gates aplicados com sucesso!", { position: "bottom-right" })
			setApplyTarget(null)
			invalidateExperiment()
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao aplicar gates: ${errorMessage}`, { position: "bottom-right" })
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
			const errorMessage = error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao renomear o gate: ${errorMessage}`, { position: "bottom-right" })
		}
	}

	return (
		<Layout>
			<Box
				sx={(theme) => ({
					padding: "1rem",
					bgcolor: theme.palette.background.default,
					width: "20%",
				})}
			>
				<Typography
					sx={(theme) => ({ color: theme.palette.text.primary })}
					variant="h5"
					fontWeight="bold"
					display="flex"
					alignItems="center"
					gap="2rem"
				>
					{experiment?.title}
					{experiment && (
						<Tooltip title="Excluir experimento">
							<IconButton onClick={() => handleDelete(experiment.id)} color="error">
								<DeleteIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					)}
				</Typography>
				<ParentTree
					files={experimentFiles}
					onSelect={setSource}
					onDeleteGate={handleDeleteGate}
					onRenameGate={handleRenameGate}
					onApplyGate={handleApplyGate}
				/>
			</Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					flex: 2,
					minWidth: 0,
					alignItems: "center",
					flexDirection: "column",
					gap: "1rem",
				}}
			>
				{isLoading && <CircularProgress />}
				{!isLoading && !source && (
					<Box>
						<Typography>Select a file to load</Typography>
					</Box>
				)}
				{source && (
					<>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography>{source.name}</Typography>
							<Tooltip title={showStats ? "Esconder estatísticas" : "Mostrar estatísticas"}>
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
							values={experiment?.values || []}
							sourceType={source.type}
							sourceId={source.id}
							fileDataId={source.fileDataId}
							parentId={source.type === "gate" ? source.id : undefined}
							loadFile={invalidateExperiment}
							siblingGateNames={siblingGateNames}
							childGates={childGates}
						/>
					</>
				)}
			</Box>
			{showStats ? (
				<Box
					sx={(theme) => ({
						width: "22%",
						minWidth: 260,
						borderLeft: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.background.default,
						overflowY: "auto",
						height: "100%",
					})}
				>
					<StatsPanel
						source={source}
						files={experimentFiles}
						values={experiment?.values || []}
						fileStats={fileStats}
						onClose={() => setShowStats(false)}
					/>
				</Box>
			) : (
				<Box
					sx={(theme) => ({
						width: 36,
						minWidth: 36,
						borderLeft: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.background.default,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						pt: 1,
						height: "100%",
						cursor: "pointer",
						"&:hover": { bgcolor: theme.palette.action.hover },
					})}
					onClick={() => setShowStats(true)}
				>
					<Tooltip title="Mostrar estatísticas" placement="left">
						<IconButton size="small" color="default">
							<StatsIcon style={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>
				</Box>
			)}
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
