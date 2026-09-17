import React, { useState } from "react"
import {
	Box,
	FormControl,
	InputAdornment,
	InputLabel,
	MenuItem,
	Popover,
	Select,
	Slider,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdCropFree as RectIcon,
	MdPentagon as PolygonIcon,
	MdAddBox as QuadrantIcon,
	MdArrowDropDown as ChevronIcon,
} from "react-icons/md"
import type { Scale } from "../../../../../types"
import type { GateTool, PlotMode } from "../../../hooks/usePlotState"
import {
	BIEX_SLIDER_MIN,
	BIEX_SLIDER_MAX,
	LINEAR_SLIDER_MAX,
	BIEX_SLIDER_MARKS,
	LINEAR_SLIDER_MARKS,
	rawToSlider,
	sliderToRaw,
} from "../../../utils/sliders"
import AxisSelect from "./AxisSelect"
import { PlotSettingsButton } from "./PlotSettingsPanel"

interface GateToolOption {
	value: GateTool
	/** Rótulo no scatter/heatmap; no histograma o rect vira intervalo. */
	label: string
	histLabel?: string
	tip: string
	icon: React.ReactNode
}

const GATE_TOOLS: GateToolOption[] = [
	{
		value: "rect",
		label: "Retangular",
		histLabel: "Intervalo (1D)",
		tip: "Desenhar um retângulo sobre a nuvem de eventos",
		icon: <RectIcon />,
	},
	{
		value: "poly",
		label: "Poligonal",
		tip: "Desenhar um polígono livre (laço) vértice a vértice",
		icon: <PolygonIcon />,
	},
	{
		value: "quad",
		label: "Quadrante",
		tip: "Cruz que divide o plot em 4 regiões (LL, UL, UR, LR)",
		icon: <QuadrantIcon />,
	},
]

interface AxisLimitSectionProps {
	axis: "X" | "Y"
	scale: Scale
	min: string
	max: string
	onMinChange: (v: string) => void
	onMaxChange: (v: string) => void
}

/** Seção de um eixo dentro do popover de limites: slider de range +
 * campos Min/Max (vazio = automático). */
const AxisLimitSection: React.FC<AxisLimitSectionProps> = ({
	axis,
	scale,
	min,
	max,
	onMinChange,
	onMaxChange,
}) => (
	<Box>
		<Typography
			variant="caption"
			fontWeight="bold"
			color="text.secondary"
			sx={{ mb: 1, display: "block", textAlign: "center" }}
		>
			Eixo {axis}
		</Typography>
		<Slider
			value={[
				min !== ""
					? rawToSlider(Number(min), scale)
					: scale === "biex"
						? BIEX_SLIDER_MIN
						: 0,
				max !== ""
					? rawToSlider(Number(max), scale)
					: scale === "biex"
						? BIEX_SLIDER_MAX
						: LINEAR_SLIDER_MAX,
			]}
			onChange={(_, val) => {
				const [lo, hi] = val as number[]
				onMinChange(String(sliderToRaw(lo, scale)))
				onMaxChange(String(sliderToRaw(hi, scale)))
			}}
			min={scale === "biex" ? BIEX_SLIDER_MIN : 0}
			max={scale === "biex" ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX}
			step={scale === "biex" ? 0.01 : 500}
			marks={scale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
			valueLabelDisplay="auto"
			valueLabelFormat={(v) => {
				const raw = sliderToRaw(v, scale)
				return raw === 0 ? "0" : raw.toLocaleString()
			}}
			size="small"
			sx={{
				height: 4,
				mx: 0.75,
				mb: 1.5,
				width: "auto",
				display: "block",
				"& .MuiSlider-markLabel": { fontSize: "0.55rem" },
				"& .MuiSlider-thumb": { width: 10, height: 10 },
			}}
		/>
		<Box sx={{ display: "flex", gap: 1 }}>
			<TextField
				label="Min"
				type="number"
				size="small"
				value={min}
				placeholder="auto"
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					onMinChange(e.target.value)
				}
				sx={{
					flex: 1,
					"& .MuiInputBase-input": {
						fontSize: "0.75rem",
						padding: "4px 8px",
					},
					"& .MuiInputLabel-root": { fontSize: "0.7rem" },
				}}
			/>
			<TextField
				label="Max"
				type="number"
				size="small"
				value={max}
				placeholder="auto"
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					onMaxChange(e.target.value)
				}
				sx={{
					flex: 1,
					"& .MuiInputBase-input": {
						fontSize: "0.75rem",
						padding: "4px 8px",
					},
					"& .MuiInputLabel-root": { fontSize: "0.7rem" },
				}}
			/>
		</Box>
	</Box>
)

interface AxisLimitsControlProps {
	axis: "X" | "Y"
	scale: Scale
	min: string
	max: string
	onMinChange: (v: string) => void
	onMaxChange: (v: string) => void
}

/**
 * Campo de limites do eixo — mesmo display outlined dos selects (label na
 * borda, chevron no fim). O popover mostra o slider de range + Min/Max;
 * campo vazio = automático.
 */
const AxisLimitsControl: React.FC<AxisLimitsControlProps> = ({
	axis,
	scale,
	min,
	max,
	onMinChange,
	onMaxChange,
}) => {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)
	const label =
		min === "" && max === "" ? "auto" : `${min || "…"} – ${max || "…"}`
	return (
		<>
			<Tooltip title={`Limites do eixo ${axis}`}>
				<TextField
					label={`Limites ${axis}`}
					size="small"
					variant="outlined"
					value={label}
					onClick={(e) => setAnchor(e.currentTarget)}
					aria-haspopup="true"
					aria-expanded={Boolean(anchor)}
					InputProps={{
						readOnly: true,
						endAdornment: (
							<InputAdornment position="end">
								<ChevronIcon />
							</InputAdornment>
						),
					}}
					sx={{
						width: 160,
						cursor: "pointer",
						"& .MuiInputBase-input": {
							cursor: "pointer",
							fontWeight: 600,
						},
					}}
				/>
			</Tooltip>
			<Popover
				anchorEl={anchor}
				open={Boolean(anchor)}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				slotProps={{
					paper: {
						sx: {
							p: 2,
							width: 280,
							border: "1px solid",
							borderColor: "divider",
						},
					},
				}}
			>
				<AxisLimitSection
					axis={axis}
					scale={scale}
					min={min}
					max={max}
					onMinChange={onMinChange}
					onMaxChange={onMaxChange}
				/>
			</Popover>
		</>
	)
}

export interface PlotToolbarProps {
	values: string[]
	plotMode: PlotMode
	onPlotModeChange: (m: PlotMode) => void
	xAxis: string
	yAxis: string
	onSelectX: (v: string) => void
	onSelectY: (v: string) => void
	tool: GateTool
	onToolChange: (t: GateTool) => void
	xScale: Scale
	yScale: Scale
	onXScaleChange: (s: Scale) => void
	onYScaleChange: (s: Scale) => void
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	cutoff: number
	onCutoffChange: (c: number) => void
	onXMinChange: (v: string) => void
	onXMaxChange: (v: string) => void
	onYMinChange: (v: string) => void
	onYMaxChange: (v: string) => void
	/** Ferramentas/config escondidas durante reshape ou edição de gate. */
	controlsEnabled: boolean
	settingsOpen: boolean
	onToggleSettings: () => void
}

/**
 * Barra de controles acima do plot (FE-26): tipo de gráfico, eixos, tipo de
 * gate, escalas e limites como selects de texto — mesmo display do seletor
 * de modo — com settings e histórico como ícones no fim da barra.
 */
const PlotToolbar: React.FC<PlotToolbarProps> = ({
	values,
	plotMode,
	onPlotModeChange,
	xAxis,
	yAxis,
	onSelectX,
	onSelectY,
	tool,
	onToolChange,
	xScale,
	yScale,
	onXScaleChange,
	onYScaleChange,
	xMin,
	xMax,
	yMin,
	yMax,
	cutoff,
	onCutoffChange,
	onXMinChange,
	onXMaxChange,
	onYMinChange,
	onYMaxChange,
	controlsEnabled,
	settingsOpen,
	onToggleSettings,
}) => {
	const histogram = plotMode === "histogram"
	const visibleTools = histogram
		? GATE_TOOLS.filter((t) => t.value === "rect")
		: GATE_TOOLS
	const currentTool = GATE_TOOLS.find((t) => t.value === tool)

	const advancedControls = controlsEnabled ? (
		<>
			{/* Tipo de gate — mesmo display outlined dos selects de eixo;
					    tooltip em cada item ajuda a identificar. */}
			<FormControl size="small" variant="outlined">
				<InputLabel id="gate-tool-label">Gate</InputLabel>
				<Select
					labelId="gate-tool-label"
					label="Gate"
					value={tool}
					onChange={(e) => onToolChange(e.target.value as GateTool)}
					renderValue={() => (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
							}}
						>
							{currentTool?.icon}
							{histogram
								? (currentTool?.histLabel ?? currentTool?.label)
								: currentTool?.label}
						</Box>
					)}
					sx={{ fontWeight: 600 }}
				>
					{visibleTools.map((t) => (
						<MenuItem key={t.value} value={t.value}>
							<Tooltip title={t.tip} placement="right" arrow>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										width: "100%",
									}}
								>
									{t.icon}
									{histogram ? (t.histLabel ?? t.label) : t.label}
								</Box>
							</Tooltip>
						</MenuItem>
					))}
				</Select>
			</FormControl>
			{/* Escalas como selects outlined (linear/biex); Y some no histograma. */}
			<FormControl size="small" variant="outlined">
				<InputLabel id="x-scale-label">Escala X</InputLabel>
				<Select
					labelId="x-scale-label"
					label="Escala X"
					value={xScale}
					onChange={(e) => onXScaleChange(e.target.value as Scale)}
					sx={{ fontWeight: 600 }}
				>
					<MenuItem value="linear">Linear</MenuItem>
					<MenuItem value="biex">Biex</MenuItem>
				</Select>
			</FormControl>
			{!histogram && (
				<FormControl size="small" variant="outlined">
					<InputLabel id="y-scale-label">Escala Y</InputLabel>
					<Select
						labelId="y-scale-label"
						label="Escala Y"
						value={yScale}
						onChange={(e) => onYScaleChange(e.target.value as Scale)}
						sx={{ fontWeight: 600 }}
					>
						<MenuItem value="linear">Linear</MenuItem>
						<MenuItem value="biex">Biex</MenuItem>
					</Select>
				</FormControl>
			)}
			<AxisLimitsControl
				axis="X"
				scale={xScale}
				min={xMin}
				max={xMax}
				onMinChange={onXMinChange}
				onMaxChange={onXMaxChange}
			/>
			{!histogram && (
				<AxisLimitsControl
					axis="Y"
					scale={yScale}
					min={yMin}
					max={yMax}
					onMinChange={onYMinChange}
					onMaxChange={onYMaxChange}
				/>
			)}
			{/* Cutoff de densidade só existe no heatmap — como as opções
					    saíram do botão de config, ele vive na barra. */}
			{plotMode === "heatmap" && (
				<Tooltip title="Cutoff de densidade — bins com contagem ≤ cutoff ficam transparentes">
					<TextField
						label="Corte"
						type="number"
						size="small"
						variant="outlined"
						value={cutoff}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onCutoffChange(Math.max(0, Number(e.target.value) || 0))
						}
						inputProps={{ min: 0, step: 1 }}
						sx={{
							width: 92,
							"& .MuiInputBase-input": {
								fontWeight: 600,
								fontSize: "0.875rem",
							},
						}}
					/>
				</Tooltip>
			)}
			{/* No desktop todas as opções já estão na barra — o botão de
					    config (overlay) só faz sentido no mobile. O histórico
					    mora no workspace (por amostra no sourceNav; do
					    experimento no header da árvore). */}
			<Box sx={{ display: { xs: "inline-flex", md: "none" } }}>
				<PlotSettingsButton open={settingsOpen} onToggle={onToggleSettings} />
			</Box>
		</>
	) : null

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexWrap: "wrap",
				gap: { xs: 0.75, sm: 1.5 },
				width: "100%",
			}}
		>
			<FormControl size="small" variant="outlined">
				<InputLabel id="plot-mode-label">Modo</InputLabel>
				<Select
					labelId="plot-mode-label"
					label="Modo"
					value={plotMode}
					onChange={(e) => onPlotModeChange(e.target.value as PlotMode)}
					sx={{ fontWeight: 600 }}
				>
					<MenuItem value="heatmap">Heatmap</MenuItem>
					<MenuItem value="scatter">Scatter</MenuItem>
					<MenuItem value="histogram">Histograma</MenuItem>
				</Select>
			</FormControl>
			<AxisSelect
				label="X"
				value={xAxis}
				options={values}
				onChange={onSelectX}
				size="small"
			/>
			{!histogram && (
				<>
					<Typography variant="caption" color="text.secondary">
						vs
					</Typography>
					<AxisSelect
						label="Y"
						value={yAxis}
						options={values}
						onChange={onSelectY}
						size="small"
					/>
				</>
			)}
			{advancedControls}
		</Box>
	)
}

export default PlotToolbar
