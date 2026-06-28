import React from "react"
import { MdExpandMore as ExpandMoreIcon } from "react-icons/md"
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Divider,
	Slider,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material"
import type { Scale } from "../../../types"
import type { PlotMode } from "../hooks/usePlotState"
import {
	BIEX_SLIDER_MIN,
	BIEX_SLIDER_MAX,
	LINEAR_SLIDER_MAX,
	BIEX_SLIDER_MARKS,
	LINEAR_SLIDER_MARKS,
	rawToSlider,
	sliderToRaw,
} from "../utils/sliders"

interface PlotSettingsProps {
	plotMode: PlotMode
	xScale: Scale
	yScale: Scale
	cutoff: number
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	onXScaleChange: (s: Scale) => void
	onYScaleChange: (s: Scale) => void
	onCutoffChange: (c: number) => void
	onXMinChange: (v: string) => void
	onXMaxChange: (v: string) => void
	onYMinChange: (v: string) => void
	onYMaxChange: (v: string) => void
}

const PlotSettings: React.FC<PlotSettingsProps> = ({
	plotMode,
	xScale,
	yScale,
	cutoff,
	xMin,
	xMax,
	yMin,
	yMax,
	onXScaleChange,
	onYScaleChange,
	onCutoffChange,
	onXMinChange,
	onXMaxChange,
	onYMinChange,
	onYMaxChange,
}) => (
	<Accordion sx={{ width: "100%", maxWidth: 540 }} defaultExpanded={false}>
		<AccordionSummary expandIcon={<ExpandMoreIcon />}>
			<Typography variant="subtitle2" fontWeight="bold">
				Configurações
			</Typography>
		</AccordionSummary>
		<AccordionDetails>
			<Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				{/* Escala */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					<Typography variant="caption" color="text.secondary">
						Escala
					</Typography>
					<ToggleButtonGroup
						value={xScale}
						exclusive
						onChange={(_, v: Scale | null) => v && onXScaleChange(v)}
						size="small"
						fullWidth
					>
						<ToggleButton value="linear" title="Eixo X linear">X lin</ToggleButton>
						<ToggleButton value="biex" title="Eixo X biex">X biex</ToggleButton>
					</ToggleButtonGroup>
					{plotMode !== "histogram" && (
						<ToggleButtonGroup
							value={yScale}
							exclusive
							onChange={(_, v: Scale | null) => v && onYScaleChange(v)}
							size="small"
							fullWidth
						>
							<ToggleButton value="linear" title="Eixo Y linear">Y lin</ToggleButton>
							<ToggleButton value="biex" title="Eixo Y biex">Y biex</ToggleButton>
						</ToggleButtonGroup>
					)}
				</Box>

				<Divider />

				{/* Eixo X */}
				<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
					<Typography variant="caption" color="text.secondary">Eixo X</Typography>
					<Slider
						value={[
							xMin !== "" ? rawToSlider(Number(xMin), xScale) : xScale === "biex" ? BIEX_SLIDER_MIN : 0,
							xMax !== "" ? rawToSlider(Number(xMax), xScale) : xScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX,
						]}
						onChange={(_, val) => {
							const [lo, hi] = val as number[]
							onXMinChange(String(sliderToRaw(lo, xScale)))
							onXMaxChange(String(sliderToRaw(hi, xScale)))
						}}
						min={xScale === "biex" ? BIEX_SLIDER_MIN : 0}
						max={xScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX}
						step={xScale === "biex" ? 0.01 : 500}
						marks={xScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
						valueLabelDisplay="auto"
						valueLabelFormat={(v) => {
							const raw = sliderToRaw(v, xScale)
							return raw === 0 ? "0" : raw.toLocaleString()
						}}
						size="small"
						sx={{ "& .MuiSlider-markLabel": { fontSize: "0.55rem" }, mb: 1 }}
					/>
					<Box sx={{ display: "flex", gap: "0.5rem" }}>
						<TextField label="Min" type="number" size="small" value={xMin} onChange={(e) => onXMinChange(e.target.value)} sx={{ flex: 1 }} />
						<TextField label="Max" type="number" size="small" value={xMax} onChange={(e) => onXMaxChange(e.target.value)} sx={{ flex: 1 }} />
					</Box>
				</Box>

				{/* Eixo Y */}
				{plotMode !== "histogram" && (
					<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
						<Typography variant="caption" color="text.secondary">Eixo Y</Typography>
						<Slider
							value={[
								yMin !== "" ? rawToSlider(Number(yMin), yScale) : yScale === "biex" ? BIEX_SLIDER_MIN : 0,
								yMax !== "" ? rawToSlider(Number(yMax), yScale) : yScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX,
							]}
							onChange={(_, val) => {
								const [lo, hi] = val as number[]
								onYMinChange(String(sliderToRaw(lo, yScale)))
								onYMaxChange(String(sliderToRaw(hi, yScale)))
							}}
							min={yScale === "biex" ? BIEX_SLIDER_MIN : 0}
							max={yScale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX}
							step={yScale === "biex" ? 0.01 : 500}
							marks={yScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
							valueLabelDisplay="auto"
							valueLabelFormat={(v) => {
								const raw = sliderToRaw(v, yScale)
								return raw === 0 ? "0" : raw.toLocaleString()
							}}
							size="small"
							sx={{ "& .MuiSlider-markLabel": { fontSize: "0.55rem" }, mb: 1 }}
						/>
						<Box sx={{ display: "flex", gap: "0.5rem" }}>
							<TextField label="Min" type="number" size="small" value={yMin} onChange={(e) => onYMinChange(e.target.value)} sx={{ flex: 1 }} />
							<TextField label="Max" type="number" size="small" value={yMax} onChange={(e) => onYMaxChange(e.target.value)} sx={{ flex: 1 }} />
						</Box>
					</Box>
				)}

				{/* Cutoff de densidade */}
				{plotMode === "heatmap" && (
					<>
						<Divider />
						<Box sx={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
							<Typography variant="caption" color="text.secondary">Densidade</Typography>
							<TextField
								label="Cutoff"
								type="number"
								size="small"
								value={cutoff}
								onChange={(e) => onCutoffChange(Math.max(0, Number(e.target.value) || 0))}
								inputProps={{ min: 0, step: 1 }}
								fullWidth
								title="Bins com contagem <= cutoff ficam transparentes"
							/>
						</Box>
					</>
				)}
			</Box>
		</AccordionDetails>
	</Accordion>
)

export default PlotSettings
