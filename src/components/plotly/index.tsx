import { MdCropFree as CropFreeSharpIcon } from "react-icons/md"
import { MdGesture as GestureIcon } from "react-icons/md"
import { MdGridOn as HeatmapIcon } from "react-icons/md"
import { MdScatterPlot as DotPlotIcon } from "react-icons/md"
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
import { useQuery } from "@tanstack/react-query"
import CytometryApi from "../../API"
import { DensityResponse, NewGate } from "../../types"

type PlotMode = "heatmap" | "scatter"

interface ScatterPlotProps {
	values: string[]
	sourceType: "file" | "gate"
	sourceId: number
	fileDataId: number
	parentId?: number
	loadFile: () => void
}

// Converte as bordas (n+1) do histograma em centros (n) para o eixo do heatmap.
const edgesToCenters = (edges?: number[]): number[] => {
	if (!edges || edges.length < 2) return []
	const centers: number[] = []
	for (let i = 0; i < edges.length - 1; i++) {
		centers.push((edges[i] + edges[i + 1]) / 2)
	}
	return centers
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({
	values,
	sourceType,
	sourceId,
	fileDataId,
	parentId,
	loadFile,
}) => {
	const [y_axix_selector, set_y_axis_selector] = useState("SSC-A")
	const [x_axix_selector, set_x_axis_selector] = useState("FSC-A")
	const [plotMode, setPlotMode] = useState<PlotMode>("heatmap")
	const [isSelecting, setIsSelecting] = useState(false)
	const [selectedSquareName, setSelectedSquareName] = useState("")
	const [selectionArea, setSelectionArea] = useState<{
		startX: number
		startY: number
		endX: number
		endY: number
	} | null>(null)
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	// Busca os dados agregados no backend (cacheados pelo React Query enquanto
	// o experimento está aberto). O cálculo pesado fica 100% no back.
	const { data, isLoading, isError } = useQuery<DensityResponse>({
		queryKey: [
			"density",
			sourceType,
			sourceId,
			x_axix_selector,
			y_axix_selector,
			plotMode,
		],
		queryFn: async () => {
			const base =
				sourceType === "file"
					? `/experiment/file/${sourceId}`
					: `/analytics/gate/${sourceId}`
			const params =
				plotMode === "heatmap"
					? "mode=heatmap&bins=200"
					: "mode=scatter&sample=5000"
			const res = await CytometryApi.get<DensityResponse>(
				`${base}/density?x=${encodeURIComponent(
					x_axix_selector,
				)}&y=${encodeURIComponent(y_axix_selector)}&${params}`,
			)
			return res.data
		},
	})

	const handleSelectX = (e: SelectChangeEvent<string>) => {
		if (e.target) set_x_axis_selector(e.target.value)
	}
	const handleSelectY = (e: SelectChangeEvent<string>) => {
		if (e.target) set_y_axis_selector(e.target.value)
	}

	const handlePlotMode = (_: React.MouseEvent, mode: PlotMode | null) => {
		if (mode) setPlotMode(mode)
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
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setSelectedSquareName(event.target.value)
	}

	const handleSquareNameSubmit = async () => {
		if (selectedSquareName && selectionArea) {
			const newSelection: NewGate = {
				file_data: fileDataId,
				name: selectedSquareName,
				parent: parentId,
				gate_coordinates: selectionArea,
				dashboard: {
					name: `${x_axix_selector} X ${y_axix_selector}`,
					dashboard_config: {
						x_axis_label: x_axix_selector,
						y_axis_label: y_axix_selector,
					},
					file_data: fileDataId,
				},
			}

			await CytometryApi.post("analytics/gate", newSelection)
			setSelectionArea(null)
			setSelectedSquareName("")
			handleDialogClose()
			loadFile()
		}
	}

	// Monta os traces do Plotly conforme o modo selecionado.
	const plotData: any[] =
		plotMode === "heatmap"
			? [
					{
						type: "heatmap",
						z: data?.histogram ?? [],
						x: edgesToCenters(data?.x_edges),
						y: edgesToCenters(data?.y_edges),
						colorscale: "Jet",
						showscale: true,
					},
			  ]
			: [
					{
						type: "scattergl",
						mode: "markers",
						x: data?.x ?? [],
						y: data?.y ?? [],
						marker: { color: "black", size: 2 },
					},
			  ]

	const hasData =
		plotMode === "heatmap"
			? !!data?.histogram?.length
			: !!data?.x?.length

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
				<ToggleButtonGroup
					value={plotMode}
					exclusive
					onChange={handlePlotMode}
				>
					<ToggleButton value="heatmap" size="small" title="Heatmap (densidade)">
						<HeatmapIcon />
					</ToggleButton>
					<ToggleButton value="scatter" size="small" title="Dot plot (amostra)">
						<DotPlotIcon />
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>
			{data && (
				<Typography variant="caption" color="text.secondary">
					{data.total_events.toLocaleString()} eventos
					{plotMode === "scatter" && data.sampled_events
						? ` · amostra de ${data.sampled_events.toLocaleString()}`
						: " · heatmap (100% dos dados)"}
				</Typography>
			)}
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
					{isLoading ? (
						<CircularProgress />
					) : isError ? (
						<Typography color="error">Erro ao carregar dados.</Typography>
					) : hasData ? (
						<Plot
							data={plotData}
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
						<Typography>Sem dados para os eixos selecionados.</Typography>
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
