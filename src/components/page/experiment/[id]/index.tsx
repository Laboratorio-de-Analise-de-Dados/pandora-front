import { Box, CircularProgress, Typography } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import Layout from "../../../Layout"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CytometryApi from "../../../../API"
import { Experiment, ExperimentFiles } from "../../../../types"
import ScatterPlot from "../../../plotly"
import ParentTree, { SelectedSource } from "../../../parent_tree"
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
				<ParentTree files={experimentFiles} onSelect={setSource} onDeleteGate={handleDeleteGate} />
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
						/>
					</>
				)}
			</Box>
		</Layout>
	)
}
