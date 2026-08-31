import React, { useState } from "react"
import { MdClose as CloseIcon, MdSettings as SettingsIcon } from "react-icons/md"
import {
	Box,
	Divider,
	Drawer,
	IconButton,
	Paper,
	Slider,
	TextField,
	FormControlLabel,
	Checkbox,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@mui/material"
import type { Scale } from "../../../../../types"
import type { PlotMode } from "../../../hooks/usePlotState"
import {
	BIEX_SLIDER_MIN,
	BIEX_SLIDER_MAX,
	LINEAR_SLIDER_MAX,
	BIEX_SLIDER_MARKS,
	LINEAR_SLIDER_MARKS,
	rawToSlider,
	sliderToRaw,
} from "../../../utils/sliders"

interface PlotSettingsControls {
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
	onPlotModeChange: (m: PlotMode) => void
}

interface PlotSettingsPanelProps extends PlotSettingsControls {
	open: boolean
	onClose: () => void
	/** `drawer` no mobile; `inline` no desktop, ocupando espaço ao lado do plot. */
	variant: "inline" | "drawer"
}

/** Botão que abre/fecha as configurações, ancorado ao canto do gráfico. */
export const PlotSettingsButton: React.FC<{
	open: boolean
	onToggle: () => void
}> = ({ open, onToggle }) => (
	<Tooltip title={open ? "Fechar configurações" : "Abrir configurações"}>
		<IconButton
			onClick={onToggle}
			size="small"
			sx={{
				position: "absolute",
				top: 8,
				left: 8,
				zIndex: 25,
				backgroundColor: "rgba(255, 255, 255, 0.85)",
				border: "1px solid",
				borderColor: "divider",
				"&:hover": {
					backgroundColor: "rgba(255, 255, 255, 0.9)",
					boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
				},
			}}
		>
			<SettingsIcon fontSize="small" />
		</IconButton>
	</Tooltip>
)

const PlotSettingsContent: React.FC<
	PlotSettingsControls & { onClose: () => void }
> = ({
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
	onPlotModeChange,
	onClose,
}) => {
	const [isAdjusting, setIsAdjusting] = useState(false)

	return (
		<>
			{/* Header */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 2,
				}}
			>
				<Typography variant="subtitle2" fontWeight="bold">
					Configurações do Gráfico
				</Typography>
				<IconButton size="small" onClick={onClose}>
					<CloseIcon style={{ fontSize: "18px" }} />
				</IconButton>
			</Box>

			{/* Tipo de gráfico */}
			<Box sx={{ mb: 2 }}>
				<Typography
					variant="caption"
					fontWeight="bold"
					color="text.secondary"
					sx={{ mb: 1, display: "block" }}
				>
					Tipo de gráfico
				</Typography>
				<ToggleButtonGroup
					value={plotMode}
					exclusive
					size="small"
					fullWidth
					onChange={(_, mode) => {
						if (mode) onPlotModeChange(mode as PlotMode)
					}}
				>
					<ToggleButton value="scatter" sx={{ fontSize: "0.7rem", py: 0.3 }}>
						Dot
					</ToggleButton>
					<ToggleButton value="heatmap" sx={{ fontSize: "0.7rem", py: 0.3 }}>
						Heatmap
					</ToggleButton>
					<ToggleButton value="histogram" sx={{ fontSize: "0.7rem", py: 0.3 }}>
						Hist
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			<Divider sx={{ my: 2 }} />

			{/* Escala */}
			<Box sx={{ mb: 2 }}>
				<Typography
					variant="caption"
					fontWeight="bold"
					color="text.secondary"
					sx={{ mb: 1, display: "block" }}
				>
					Escala
				</Typography>
				<FormControlLabel
					control={
						<Checkbox
							checked={xScale === "biex"}
							onChange={(e) =>
								onXScaleChange(e.target.checked ? "biex" : "linear")
							}
							size="small"
						/>
					}
					label={<Typography variant="caption">X Biex</Typography>}
				/>

				{plotMode !== "histogram" && (
					<FormControlLabel
						control={
							<Checkbox
								checked={yScale === "biex"}
								onChange={(e) =>
									onYScaleChange(e.target.checked ? "biex" : "linear")
								}
								size="small"
							/>
						}
						label={<Typography variant="caption">Y Biex</Typography>}
					/>
				)}
			</Box>

			<Divider sx={{ my: 2 }} />

			{/* Eixo X */}
			<Box sx={{ mb: 2, opacity: isAdjusting ? 0.75 : 1 }}>
				<Typography
					variant="caption"
					fontWeight="bold"
					color="text.secondary"
					sx={{ mb: 1, display: "block" }}
				>
					Eixo X
				</Typography>

				<Slider
					value={[
						xMin !== ""
							? rawToSlider(Number(xMin), xScale)
							: xScale === "biex"
								? BIEX_SLIDER_MIN
								: 0,
						xMax !== ""
							? rawToSlider(Number(xMax), xScale)
							: xScale === "biex"
								? BIEX_SLIDER_MAX
								: LINEAR_SLIDER_MAX,
					]}
					onChange={(_, val) => {
						const [lo, hi] = val as number[]
						onXMinChange(String(sliderToRaw(lo, xScale)))
						onXMaxChange(String(sliderToRaw(hi, xScale)))
						setIsAdjusting(true)
					}}
					onChangeCommitted={() => setIsAdjusting(false)}
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
					sx={{
						height: 4,
						"& .MuiSlider-markLabel": { fontSize: "0.55rem" },
						"& .MuiSlider-thumb": { width: 10, height: 10 },
					}}
				/>

				<Box sx={{ display: "flex", gap: 1 }}>
					<TextField
						label="Min"
						type="number"
						size="small"
						value={xMin}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onXMinChange(e.target.value)
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
						value={xMax}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							onXMaxChange(e.target.value)
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

			{/* Eixo Y */}
			{plotMode !== "histogram" && (
				<>
					<Divider sx={{ my: 2 }} />
					<Box sx={{ mb: 2, opacity: isAdjusting ? 0.75 : 1 }}>
						<Typography
							variant="caption"
							fontWeight="bold"
							color="text.secondary"
							sx={{ mb: 1, display: "block" }}
						>
							Eixo Y
						</Typography>

						<Slider
							value={[
								yMin !== ""
									? rawToSlider(Number(yMin), yScale)
									: yScale === "biex"
										? BIEX_SLIDER_MIN
										: 0,
								yMax !== ""
									? rawToSlider(Number(yMax), yScale)
									: yScale === "biex"
										? BIEX_SLIDER_MAX
										: LINEAR_SLIDER_MAX,
							]}
							onChange={(_, val) => {
								const [lo, hi] = val as number[]
								onYMinChange(String(sliderToRaw(lo, yScale)))
								onYMaxChange(String(sliderToRaw(hi, yScale)))
								setIsAdjusting(true)
							}}
							onChangeCommitted={() => setIsAdjusting(false)}
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
							sx={{
								"& .MuiSlider-markLabel": { fontSize: "0.55rem" },
								mb: 1,
							}}
						/>

						<Box sx={{ display: "flex", gap: 1 }}>
							<TextField
								label="Min"
								type="number"
								size="small"
								value={yMin}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onYMinChange(e.target.value)
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
								value={yMax}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									onYMaxChange(e.target.value)
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
				</>
			)}

			{/* Cutoff de densidade */}
			{plotMode === "heatmap" && (
				<>
					<Divider sx={{ my: 2 }} />
					<Box>
						<Typography
							variant="caption"
							fontWeight="bold"
							color="text.secondary"
							sx={{ mb: 1, display: "block" }}
						>
							Densidade
						</Typography>
						<TextField
							label="Cutoff"
							type="number"
							size="small"
							value={cutoff}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								onCutoffChange(Math.max(0, Number(e.target.value) || 0))
							}
							inputProps={{ min: 0, step: 1 }}
							fullWidth
							helperText="Bins com contagem ≤ cutoff ficam transparentes"
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
				</>
			)}
		</>
	)
}

/**
 * Painel de configurações do gráfico. No desktop é renderizado ao lado do plot
 * (o gráfico reduz em vez de ser coberto); no mobile abre como `Drawer`.
 */
export const PlotSettingsPanel: React.FC<PlotSettingsPanelProps> = ({
	open,
	onClose,
	variant,
	...controls
}) => {
	if (variant === "drawer") {
		return (
			<Drawer
				anchor="bottom"
				open={open}
				onClose={onClose}
				PaperProps={{
					sx: { maxHeight: "90vh", overflowY: "auto", padding: 1.5 },
				}}
			>
				<PlotSettingsContent {...controls} onClose={onClose} />
			</Drawer>
		)
	}

	if (!open) return null

	return (
		<Paper
			sx={{
				width: 260,
				flexShrink: 0,
				alignSelf: "flex-start",
				maxHeight: "min(70vh, 560px)",
				overflowY: "auto",
				padding: 1.5,
				borderRadius: 2,
				border: "1px solid",
				borderColor: "divider",
			}}
		>
			<PlotSettingsContent {...controls} onClose={onClose} />
		</Paper>
	)
}

export default PlotSettingsPanel
