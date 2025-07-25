import CropFreeSharpIcon from "@mui/icons-material/CropFreeSharp"
import GestureIcon from "@mui/icons-material/Gesture"
import {
	Box,
	Select,
	Button,
	CircularProgress,
	MenuItem,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	SelectChangeEvent,
} from "@mui/material"
import React, { useState } from "react"
import Plot from "react-plotly.js"
import CytometryApi from "../../API"
import { NewGate } from "../../types"

interface ScatterPlotProps {
	data: any[]
	values: string[]
	loading: boolean
	fileId: number
	parentId?: number
	loadFile: () => void
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
	data,
	loading,
	values,
	fileId,
	parentId,
	loadFile,
}) => {
	const [y_axix_selector, set_y_axis_selector] = useState("SSC-A")
	const [x_axix_selector, set_x_axis_selector] = useState("FSC-A")
	const [isSelecting, setIsSelecting] = useState(false)
	const [selectedSquareName, setSelectedSquareName] = useState("")
	const [selectionArea, setSelectionArea] = useState<{
		startX: number
		startY: number
		endX: number
		endY: number
	} | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const handleSelectX = (e: SelectChangeEvent<string>) => {
		if (e.target) set_x_axis_selector(e.target.value)
	}
	const handleSelectY = (e: SelectChangeEvent<string>) => {
		if (e.target) set_y_axis_selector(e.target.value)
	}

	const handleSelectedArea = async (event: any) => {
		if (isSelecting && event && event.range) {
			const { x, y } = event.range

			setSelectionArea({
				startX: x[0],
				startY: y[0],
				endX: x[1],
				endY: y[1],
			})
			setIsSelecting(false)
			setIsDialogOpen(true)
		}
	}

	const handleDialogClose = () => {
		setIsDialogOpen(false)
	}

	const handleSquareNameChange = (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setSelectedSquareName(event.target.value)
	}

	const handleSquareNameSubmit = async () => {
		if (selectedSquareName && selectionArea) {
			const newSelection: NewGate = {
				file_data: fileId,
				name: selectedSquareName,
				parent: parentId,
				gate_coordinates: selectionArea,
				dashboard: {
					name: `${x_axix_selector} X ${y_axix_selector}`,
					dashboard_config: {
						x_axis_label: x_axix_selector,
						y_axis_label: y_axix_selector,
					},
					file_data: fileId,
				},
			}

			await CytometryApi.post("analytics/gate", newSelection)

			setSelectionArea(null)
			setSelectedSquareName("")
			handleDialogClose()
			loadFile()
		}
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "1rem",
			}}
		>
			<Box
				sx={{
					width: "fit-content",
					display: "flex",
					alignItems: "center",
					gap: "1rem",
				}}
			>
				<Typography variant="subtitle1" sx={{ marginBottom: "0.5rem" }}>
					Ferramentas:
				</Typography>
				<ToggleButtonGroup
					value={isSelecting ? "crop" : "gesture"}
					exclusive
					onChange={() => setIsSelecting(!isSelecting)}
				>
					<ToggleButton value="crop" size="small">
						<CropFreeSharpIcon />
					</ToggleButton>
					<ToggleButton value="gesture" size="small">
						<GestureIcon />
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: "1rem",
					}}
				>
					<Select
						onChange={handleSelectY}
						value={y_axix_selector}
						sx={{
							transform: "rotate(-90deg)",
						}}
					>
						{values.map((value, index) => (
							<MenuItem key={index} value={value}>
								{value}
							</MenuItem>
						))}
					</Select>
					{data.length ? (
						<Plot
							data={[
								{
									type: "scatter",
									mode: "markers",
									x: data.map(
										(item) =>
											item[
												x_axix_selector
													.toLowerCase()
													.replace(" ", "")
													.replace("-", "_")
											]
									),
									y: data.map(
										(item) =>
											item[
												y_axix_selector
													.toLowerCase()
													.replace(" ", "")
													.replace("-", "_")
											]
									),
									marker: { color: "black", size: 1 },
								},
							]}
							layout={{
								dragmode: "select",
								xaxis: { title: `${x_axix_selector}` },
								yaxis: { title: `${y_axix_selector}` },
								width: 500,
								height: 500,
								plot_bgcolor: "#FFFFFF",
								paper_bgcolor: "#FFFFFF",
							}}
							onSelected={handleSelectedArea}
						/>
					) : (
						<CircularProgress />
					)}
				</Box>
				<Select value={x_axix_selector} onChange={handleSelectX}>
					{values.map((value, index) => (
						<MenuItem key={index} value={value}>
							{value}
						</MenuItem>
					))}
				</Select>
			</Box>

			<Dialog open={isDialogOpen} onClose={handleDialogClose}>
				<DialogTitle>Inserir Nome da Seleção</DialogTitle>
				<DialogContent>
					<TextField
						label="Nome da Seleção"
						value={selectedSquareName}
						onChange={handleSquareNameChange}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleSquareNameSubmit}>Salvar</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default ScatterPlot
