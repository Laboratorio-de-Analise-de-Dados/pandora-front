import { Box, CircularProgress, Typography } from "@mui/material"
import { DataGrid, GridColDef, GridEventListener } from "@mui/x-data-grid"
import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "react-toastify"
import CytometryApi from "../../../../API"
import { Experiment, ExperimentFiles, FileData } from "../../../../types"
import ScatterPlot from "../../../plotly"
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

	const columns: GridColDef[] = [
		{ field: "id", headerName: "id" },
		{ field: "file_name", headerName: "file name", width: 500 },
	]

	useEffect(() => {
		getExperimentData(param.id)
	}, [param.id, getExperimentData])

	const handleRowClick: GridEventListener<"rowClick"> = async (item) => {
		const fileId = item.row.id
		setLoadFile(true)
		try {
			const fileData = await CytometryApi.get(
				`/experiment/file/${fileId}/list?limit=10000`
			)
			setFileData(fileData.data)
		} catch (error: any) {
			toast.error(error.message)
		} finally {
			setLoadFile(false)
		}
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "2rem",
				justifyContent: "space-around",
				padding: "2rem",
				height: "80vh",
			}}
		>
			<Box>
				<Typography>{experiment?.title}</Typography>
			</Box>
			<Box sx={{ height: "70%", display: "flex", gap: "2rem" }}>
				<DataGrid
					columns={columns}
					rows={experimentFiles}
					loading={loading}
					onRowClick={handleRowClick}
				></DataGrid>
				<Box
					sx={{
						width: "50%",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						gap: "2rem",
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
							/>
						</>
					)}
				</Box>
			</Box>
		</Box>
	)
}
