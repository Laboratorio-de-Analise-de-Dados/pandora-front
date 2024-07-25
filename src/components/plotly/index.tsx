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

interface Selection {
	name: string
	area: {
		startX: number
		startY: number
		endX: number
		endY: number
	}
	selectedIds: number[]
}

interface ScatterPlotProps {
	data: any[]
	values: string[]
	loading: boolean
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ data, loading, values }) => {
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
	const [selections, setSelections] = useState<Selection[]>([])
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
			const newSelection: Selection = {
				name: selectedSquareName,
				area: selectionArea,
				selectedIds: data
					.filter(
						(item) =>
							item.x >= selectionArea.startX &&
							item.x <= selectionArea.endX &&
							item.y >= selectionArea.startY &&
							item.y <= selectionArea.endY
					)
					.map((item) => item.id),
			}

			setSelections((prevSelections) => [...prevSelections, newSelection])

			const gateData = {
				x_min: selectionArea.startX,
				y_min: selectionArea.startY,
				x_max: selectionArea.endX,
				y_max: selectionArea.endY,
				y_value: y_axix_selector
					.toLowerCase()
					.replace(" ", "")
					.replace("-", "_"),
				x_value: x_axix_selector
					.toLowerCase()
					.replace(" ", "")
					.replace("-", "_"),
				name: selectedSquareName,
			}

			const createGate = await CytometryApi.post("/experiment/gate", gateData)

			setSelectionArea(null)
			setSelectedSquareName("")
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
								plot_bgcolor: "#4a1717",
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
			{loading && <CircularProgress />}

			{selections.map((selection, index) => (
				<div key={index}>
					Nome: {selection.name}, Área: {JSON.stringify(selection.area)}, IDs:{" "}
					{selection.selectedIds.join(", ")}
				</div>
			))}

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

			{selectionArea && (
				<>
					<rect
						x={selectionArea.startX}
						y={selectionArea.startY}
						width={selectionArea.endX - selectionArea.startX}
						height={selectionArea.endY - selectionArea.startY}
						fill="rgba(255, 0, 0, 0.3)"
					/>
					<div>
						<TextField
							label="Nome do Quadrado"
							value={selectedSquareName}
							onChange={handleSquareNameChange}
						/>
						<Button variant="contained" onClick={handleSquareNameSubmit}>
							Salvar
						</Button>
					</div>
				</>
			)}
		</Box>
	)
}

export default ScatterPlot
