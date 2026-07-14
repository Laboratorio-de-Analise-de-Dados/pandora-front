import React from "react"
import {
	MdCropFree as CropFreeSharpIcon,
	MdGridOn as HeatmapIcon,
	MdScatterPlot as DotPlotIcon,
	MdBarChart as HistogramIcon,
	MdRefresh as RefreshIcon,
	MdPentagon as PolygonIcon,
	MdAddBox as QuadrantIcon,
} from "react-icons/md"
import {
	Box,
	Button,
	CircularProgress,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material"
import { PlotToolbarProps } from "./type"
import type { PlotMode, GateTool } from "../../../../hooks/usePlotState"
const PlotToolbar: React.FC<PlotToolbarProps> = ({
	tool,
	plotMode,
	onToolChange,
	onPlotModeChange,
	onRecompute,
	isRecomputing,
}) => (
	<Box
		sx={{
			width: "fit-content",
			display: "flex",
			alignItems: "center",
			gap: "1rem",
		}}
	>
		<Typography variant="subtitle1">Ferramentas:</Typography>
		<ToggleButtonGroup
			value={tool}
			exclusive
			onChange={(_, v: GateTool | null) => v && onToolChange(v)}
		>
			<ToggleButton
				value="rect"
				size="small"
				title={
					plotMode === "histogram"
						? "Gate de intervalo (1D)"
						: "Gate retangular"
				}
			>
				<CropFreeSharpIcon />
			</ToggleButton>
			{plotMode !== "histogram" && (
				<ToggleButton value="poly" size="small" title="Gate poligonal (laço)">
					<PolygonIcon />
				</ToggleButton>
			)}
			{plotMode !== "histogram" && (
				<ToggleButton
					value="quad"
					size="small"
					title="Gate de quadrante (cruz)"
				>
					<QuadrantIcon />
				</ToggleButton>
			)}
		</ToggleButtonGroup>
		<ToggleButtonGroup
			value={plotMode}
			exclusive
			onChange={(_, v: PlotMode | null) => v && onPlotModeChange(v)}
		>
			<ToggleButton value="heatmap" size="small" title="Heatmap (densidade)">
				<HeatmapIcon />
			</ToggleButton>
			<ToggleButton value="scatter" size="small" title="Dot plot (amostra)">
				<DotPlotIcon />
			</ToggleButton>
			<ToggleButton
				value="histogram"
				size="small"
				title="Histograma (distribuição)"
			>
				<HistogramIcon />
			</ToggleButton>
		</ToggleButtonGroup>
		<Button
			size="small"
			variant="outlined"
			startIcon={
				isRecomputing ? <CircularProgress size={16} /> : <RefreshIcon />
			}
			disabled={isRecomputing}
			onClick={onRecompute}
			title="Reprocessar a partir do .fcs original + gates"
		>
			Reprocessar
		</Button>
	</Box>
)

export default PlotToolbar
