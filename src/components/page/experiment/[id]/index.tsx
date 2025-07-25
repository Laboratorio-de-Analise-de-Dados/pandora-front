import { Box, CircularProgress, Typography } from "@mui/material"
import { useCallback, useEffect, useState } from "react"
import Layout from "../../../Layout"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CytometryApi from "../../../../API"
import { Experiment, ExperimentFiles, FileData, Gate } from "../../../../types"
import ScatterPlot from "../../../plotly"
import ParentTree from "../../../parent_tree"
interface Params {
	id: string
}

export default function ExperimentPage() {
	const param = useParams<Params>()
	const [experiment, setExperiment] = useState<Experiment>()
	const [experimentFiles, setExperimentFiles] = useState<ExperimentFiles[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [loadFile, setLoadFile] = useState<boolean>(false)
	const [fileData, setFileData] = useState<FileData | undefined>(undefined)
	const [gate, setGate] = useState<number | undefined>()
	const getExperimentData = useCallback(async (id: string) => {
		setLoading(true)
		try {
			const experiment = await CytometryApi.get(`/experiment/${id}`)
			setExperiment(experiment.data)
			const experimentFiles = await CytometryApi.get(
				`/experiment/list/data/${id}`
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
				>
					{experiment?.title}
				</Typography>
				<ParentTree
					files={experimentFiles}
					fileDataSet={setFileData}
					gateSet={setGate}
					loadFile={setLoadFile}
				/>
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
				{loadFile && <CircularProgress />}
				{!fileData && !loadFile && (
					<Box>
						<Typography>Select a file to load</Typography>
					</Box>
				)}
				{!loadFile && fileData?.data_set && (
					<>
						<Typography>{fileData.file_name}</Typography>
						<ScatterPlot
							data={fileData.data_set}
							loading={loading}
							values={experiment?.values || []}
							fileId={fileData.id}
							parentId={gate}
							loadFile={()=>getExperimentData(param.id)}
						/>
					</>
				)}
			</Box>
		</Layout>
	)
}
