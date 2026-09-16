import React, { useState } from "react"
import {
	Box,
	IconButton,
	MenuItem,
	Popover,
	Select,
	Switch,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdCropFree as RectIcon,
	MdPentagon as PolygonIcon,
	MdAddBox as QuadrantIcon,
	MdHistory as HistoryIcon,
	MdArrowDropDown as ChevronIcon,
} from "react-icons/md"
import type { Scale } from "../../../../../types"
import type { GateTool, PlotMode } from "../../../hooks/usePlotState"
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

const SCALE_LABEL: Record<Scale, string> = {
	linear: "Linear",
	biex: "Biex",
}

interface AxisLimitsControlProps {
	axis: "X" | "Y"
	min: string
	max: string
	onMinChange: (v: string) => void
	onMaxChange: (v: string) => void
}

/** Linha Min/Max com toggle auto↔manual — string vazia no estado = automático. */
const BoundRow: React.FC<{
	label: string
	value: string
	onChange: (v: string) => void
}> = ({ label, value, onChange }) => {
	const auto = value === ""
	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
			<Typography
				variant="caption"
				fontWeight={600}
				color="text.secondary"
				sx={{ width: 30 }}
			>
				{label}
			</Typography>
			<TextField
				type="number"
				size="small"
				value={value}
				disabled={auto}
				placeholder="auto"
				onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					onChange(e.target.value)
				}
				sx={{
					flex: 1,
					"& .MuiInputBase-input": {
						fontSize: "0.75rem",
						padding: "4px 8px",
					},
				}}
			/>
			<Tooltip title={auto ? "Fixar valor manual" : "Voltar ao automático"}>
				<Switch
					size="small"
					checked={!auto}
					onChange={(_, manual) => onChange(manual ? "0" : "")}
				/>
			</Tooltip>
		</Box>
	)
}

/** Dropdown de limites do eixo — mesmo display dos selects (texto + chevron). */
const AxisLimitsControl: React.FC<AxisLimitsControlProps> = ({
	axis,
	min,
	max,
	onMinChange,
	onMaxChange,
}) => {
	const [anchor, setAnchor] = useState<HTMLElement | null>(null)
	const label =
		min === "" && max === ""
			? `${axis}: auto`
			: `${axis}: ${min || "…"}–${max || "…"}`
	return (
		<>
			<Tooltip title={`Limites do eixo ${axis}`}>
				<Box
					role="button"
					aria-haspopup="true"
					aria-expanded={Boolean(anchor)}
					onClick={(e) => setAnchor(e.currentTarget)}
					sx={(theme) => ({
						display: "flex",
						alignItems: "center",
						cursor: "pointer",
						fontWeight: 600,
						color:
							min === "" && max === ""
								? theme.palette.text.secondary
								: theme.palette.text.primary,
						"&:hover": { color: theme.palette.primary.main },
						"& svg": { fontSize: 20 },
					})}
				>
					{label}
					<ChevronIcon />
				</Box>
			</Tooltip>
			<Popover
				anchorEl={anchor}
				open={Boolean(anchor)}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				slotProps={{ paper: { sx: { p: 1.5, width: 240 } } }}
			>
				<Typography
					variant="caption"
					fontWeight="bold"
					color="text.secondary"
					sx={{ mb: 1, display: "block" }}
				>
					Limites do eixo {axis}
				</Typography>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
					<BoundRow label="Min" value={min} onChange={onMinChange} />
					<BoundRow label="Max" value={max} onChange={onMaxChange} />
				</Box>
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
	onXMinChange: (v: string) => void
	onXMaxChange: (v: string) => void
	onYMinChange: (v: string) => void
	onYMaxChange: (v: string) => void
	/** Ferramentas/config escondidas durante reshape ou edição de gate. */
	controlsEnabled: boolean
	settingsOpen: boolean
	onToggleSettings: () => void
	historyOpen?: boolean
	onToggleHistory?: () => void
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
	onXMinChange,
	onXMaxChange,
	onYMinChange,
	onYMaxChange,
	controlsEnabled,
	settingsOpen,
	onToggleSettings,
	historyOpen,
	onToggleHistory,
}) => {
	const histogram = plotMode === "histogram"
	const visibleTools = histogram
		? GATE_TOOLS.filter((t) => t.value === "rect")
		: GATE_TOOLS
	const currentTool = GATE_TOOLS.find((t) => t.value === tool)

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				flexWrap: "wrap",
				gap: { xs: 0.5, sm: 1.5 },
				width: "100%",
			}}
		>
			<Select
				value={plotMode}
				onChange={(e) => onPlotModeChange(e.target.value as PlotMode)}
				size="small"
				variant="standard"
				disableUnderline
				sx={{ fontWeight: 600 }}
			>
				<MenuItem value="heatmap">Heatmap</MenuItem>
				<MenuItem value="scatter">Scatter</MenuItem>
				<MenuItem value="histogram">Histograma</MenuItem>
			</Select>
			<AxisSelect
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
						value={yAxis}
						options={values}
						onChange={onSelectY}
						size="small"
					/>
				</>
			)}
			{controlsEnabled && (
				<>
					{/* Tipo de gate como select — mesmo display do modo de
					    gráfico; tooltip em cada item ajuda a identificar. */}
					<Select
						value={tool}
						onChange={(e) => onToolChange(e.target.value as GateTool)}
						size="small"
						variant="standard"
						disableUnderline
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
					{/* Escalas como selects (linear/biex); Y some no histograma. */}
					<Tooltip title="Escala do eixo X">
						<Select
							value={xScale}
							onChange={(e) => onXScaleChange(e.target.value as Scale)}
							size="small"
							variant="standard"
							disableUnderline
							renderValue={(v) => `X: ${SCALE_LABEL[v]}`}
							sx={{ fontWeight: 600 }}
						>
							<MenuItem value="linear">Linear</MenuItem>
							<MenuItem value="biex">Biex</MenuItem>
						</Select>
					</Tooltip>
					{!histogram && (
						<Tooltip title="Escala do eixo Y">
							<Select
								value={yScale}
								onChange={(e) => onYScaleChange(e.target.value as Scale)}
								size="small"
								variant="standard"
								disableUnderline
								renderValue={(v) => `Y: ${SCALE_LABEL[v]}`}
								sx={{ fontWeight: 600 }}
							>
								<MenuItem value="linear">Linear</MenuItem>
								<MenuItem value="biex">Biex</MenuItem>
							</Select>
						</Tooltip>
					)}
					<AxisLimitsControl
						axis="X"
						min={xMin}
						max={xMax}
						onMinChange={onXMinChange}
						onMaxChange={onXMaxChange}
					/>
					{!histogram && (
						<AxisLimitsControl
							axis="Y"
							min={yMin}
							max={yMax}
							onMinChange={onYMinChange}
							onMaxChange={onYMaxChange}
						/>
					)}
					<PlotSettingsButton open={settingsOpen} onToggle={onToggleSettings} />
					{onToggleHistory && (
						<Tooltip title="Histórico e checkpoints">
							<IconButton
								size="small"
								onClick={onToggleHistory}
								sx={historyOpen ? { color: "primary.main" } : undefined}
							>
								<HistoryIcon />
							</IconButton>
						</Tooltip>
					)}
				</>
			)}
		</Box>
	)
}

export default PlotToolbar
