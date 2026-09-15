import React from "react"
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material"
import {
	MdCropFree as RectIcon,
	MdPentagon as PolygonIcon,
	MdAddBox as QuadrantIcon,
} from "react-icons/md"
import type { GateTool, PlotMode } from "../../../hooks/usePlotState"

interface GateToolToggleProps {
	value: GateTool
	onChange: (value: GateTool) => void
	plotMode: PlotMode
}

const GateToolToggle: React.FC<GateToolToggleProps> = ({
	value,
	onChange,
	plotMode,
}) => (
	<ToggleButtonGroup
		value={value}
		exclusive
		size="small"
		onChange={(_, v: GateTool | null) => v && onChange(v)}
		sx={(theme) => ({
			position: "absolute",
			top: 8,
			right: 8,
			zIndex: 25,
			backgroundColor:
				theme.palette.mode === "dark"
					? "rgba(22, 22, 22, 0.85)"
					: "rgba(255, 255, 255, 0.85)",
			border: `1px solid ${theme.palette.divider}`,
			borderRadius: 2,
		})}
	>
		<ToggleButton value="rect">
			<Tooltip
				title={
					plotMode === "histogram"
						? "Gate de intervalo (1D)"
						: "Gate retangular"
				}
			>
				<Box sx={{ display: "flex" }}>
					<RectIcon />
				</Box>
			</Tooltip>
		</ToggleButton>
		{plotMode !== "histogram" && (
			<ToggleButton value="poly">
				<Tooltip title="Gate poligonal (laço)">
					<Box sx={{ display: "flex" }}>
						<PolygonIcon />
					</Box>
				</Tooltip>
			</ToggleButton>
		)}
		{plotMode !== "histogram" && (
			<ToggleButton value="quad">
				<Tooltip title="Gate de quadrante (cruz)">
					<Box sx={{ display: "flex" }}>
						<QuadrantIcon />
					</Box>
				</Tooltip>
			</ToggleButton>
		)}
	</ToggleButtonGroup>
)

export default GateToolToggle
