import { Box, CircularProgress, Typography } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import Layout from "../../../Layout"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CytometryApi from "../../../../API"
import { Experiment, ExperimentFiles, Gate } from "../../../../types"
import ScatterPlot from "../../../plotly"
import ParentTree, { SelectedSource } from "../../../parent_tree"
import ApplyGateDialog from "../../../apply_gate_dialog"
import { MdDelete as DeleteIcon } from "react-icons/md"
import { IconButton, Tooltip } from "@mui/material"
import { useHistory } from "react-router-dom"

interface Params {
	id: string
}

export default function ExperimentPage() {
	const param = useParams<Params>()
	const [experiment, setExperiment] = useState<Experiment>()
	const [experimentFiles, setExperimentFiles] = useState<ExperimentFiles[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [source, setSource] = useState<SelectedSource | undefined>(undefined)
	const [applyTarget, setApplyTarget] = useState<{ id: number; name: string; fileDataId: number } | null>(null)
	const [applyLoading, setApplyLoading] = useState(false)
	const router = useHistory()

	const handleDelete = async (id: number) => {
		const confirmed = window.confirm("Tem certeza que deseja excluir?")
		if (!confirmed) return

		try {
			await CytometryApi.delete(`/experiment/${id}`)
			toast.success("Experimento excluído com sucesso!", {
				position: "bottom-right",
			})
			router.push(`/experiments`)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao excluir o experimento: ${errorMessage}`, {
				position: "bottom-right",
			})
		}
	}

	// Computes child gates for the currently selected source
	const getChildGates = (): Gate[] => {
		if (!source) return []
		if (source.type === "file") {
			const file = experimentFiles.find((f) => f.id === source.id)
			return file?.gates ?? []
		}
		// Gate selected: children of this gate
		const findGateById = (gates: Gate[], id: number): Gate | undefined => {
			for (const g of gates) {
				if (g.id === id) return g
				if (g.children) {
					const found = findGateById(g.children, id)
					if (found) return found
				}
			}
			return undefined
		}
		for (const file of experimentFiles) {
			const gate = findGateById(file.gates, source.id)
			if (gate) return gate.children ?? []
		}
		return []
	}

	const childGates = getChildGates()
	const siblingGateNames = childGates.map((g) => g.name)

	const handleDeleteGate = async (gateId: number) => {
		try {
			await CytometryApi.delete(`/analytics/gate/${gateId}`)
			toast.success("Gate excluído com sucesso!", {
				position: "bottom-right",
			})
			// Se o gate excluído era a source ativa, limpa a seleção
			if (source?.type === "gate" && source.id === gateId) {
				setSource(undefined)
			}
			// Recarrega a árvore de arquivos/gates
			getExperimentData(param.id)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao excluir o gate: ${errorMessage}`, {
				position: "bottom-right",
			})
		}
	}

	const handleApplyGate = (gateId: number, gateName: string) => {
		// Find which file this gate belongs to
		let fileDataId = 0
		const findGateFile = (gates: Gate[], id: number): boolean => {
			for (const g of gates) {
				if (g.id === id) return true
				if (g.children && findGateFile(g.children, id)) return true
			}
			return false
		}
		for (const file of experimentFiles) {
			if (findGateFile(file.gates, gateId)) {
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
				on_conflict: "rename",
			})
			toast.success("Gates aplicados com sucesso!", { position: "bottom-right" })
			setApplyTarget(null)
			getExperimentData(param.id)
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
			toast.success("Gate renomeado com sucesso!", {
				position: "bottom-right",
			})
			getExperimentData(param.id)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao renomear o gate: ${errorMessage}`, {
				position: "bottom-right",
			})
		}
	}

	const getExperimentData = useCallback(async (id: string) => {
		setLoading(true)
		try {
			const experiment = await CytometryApi.get(`/experiment/${id}`)
			setExperiment(experiment.data)
			const experimentFiles = await CytometryApi.get(
				`/experiment/list/data/${id}`,
			)
			setExperimentFiles(experimentFiles.data)
		} catch (error: any) {
			toast.error(error.message, { position: "bottom-right" })
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		getExperimentData(param.id)
	}, [param.id, getExperimentData])

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
					sx={(theme) => ({
						color: theme.palette.text.primary,
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
				<ParentTree files={experimentFiles} onSelect={setSource} onDeleteGate={handleDeleteGate} onRenameGate={handleRenameGate} onApplyGate={handleApplyGate} />
			</Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					flex: 2,
					alignItems: "center",
					flexDirection: "column",
					gap: "1rem",
				}}
			>
				{loading && <CircularProgress />}
				{!loading && !source && (
					<Box>
						<Typography>Select a file to load</Typography>
					</Box>
				)}
				{source && (
					<>
						<Typography>{source.name}</Typography>
						<ScatterPlot
							key={`${source.type}-${source.id}`}
							values={experiment?.values || []}
							sourceType={source.type}
							sourceId={source.id}
							fileDataId={source.fileDataId}
							parentId={source.type === "gate" ? source.id : undefined}
							loadFile={() => getExperimentData(param.id)}
							siblingGateNames={siblingGateNames}
							childGates={childGates}
						/>
					</>
				)}
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
