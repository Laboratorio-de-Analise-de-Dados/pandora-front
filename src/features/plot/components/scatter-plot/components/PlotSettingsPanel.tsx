import React, { useState } from "react"
import {
	MdClose as CloseIcon,
	MdSettings as SettingsIcon,
	MdRestartAlt as ResetIcon,
} from "react-icons/md"
import {
	Box,
	Divider,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	Slider,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@mui/material"
import type { Scale } from "../../../../../types"
import type { PlotMode } from "../../../hooks/usePlotState"
import { rawToSlider, sliderBounds, sliderToRaw } from "../../../utils/sliders"

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
}

/** Botão que abre/fecha as configurações, na barra superior do gráfico. */
export const PlotSettingsButton: React.FC<{
	open: boolean
	onToggle: () => void
}> = ({ open, onToggle }) => (
	<Tooltip title={open ? "Fechar configurações" : "Abrir configurações"}>
		<IconButton
			onClick={onToggle}
			size="small"
			sx={{
				// Flutua sobre o plot, que é sempre claro (mesmo no dark).
				backgroundColor: "rgba(255, 255, 255, 0.85)",
				border: "1px solid",
				borderColor: "divider",
				"&:hover": {
					backgroundColor: "rgba(255, 255, 255, 0.9)",
					boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
				},
			}}
		>
			<SettingsIcon fontSize="small" />
		</IconButton>
	</Tooltip>
)

const PlotSettingsContent: React.FC<
	PlotSettingsControls & {
		onClose: () => void
		setIsAdjusting: (v: boolean) => void
	}
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
	setIsAdjusting,
}) => {
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

			{/* Escala — mesmo vocabulário do seletor da toolbar
			    (linear/biex/log), agora com a opção log do FE-44. */}
			<Box sx={{ mb: 2, display: "flex", gap: 1 }}>
				<FormControl size="small" variant="outlined" fullWidth>
					<InputLabel id="settings-x-scale-label">Escala X</InputLabel>
					<Select
						labelId="settings-x-scale-label"
						label="Escala X"
						value={xScale}
						onChange={(e) => onXScaleChange(e.target.value as Scale)}
						sx={{ fontWeight: 600 }}
					>
						<MenuItem value="linear">Linear</MenuItem>
						<MenuItem value="biex">Biex</MenuItem>
						<MenuItem value="log">Log</MenuItem>
					</Select>
				</FormControl>

				{plotMode !== "histogram" && (
					<FormControl size="small" variant="outlined" fullWidth>
						<InputLabel id="settings-y-scale-label">Escala Y</InputLabel>
						<Select
							labelId="settings-y-scale-label"
							label="Escala Y"
							value={yScale}
							onChange={(e) => onYScaleChange(e.target.value as Scale)}
							sx={{ fontWeight: 600 }}
						>
							<MenuItem value="linear">Linear</MenuItem>
							<MenuItem value="biex">Biex</MenuItem>
							<MenuItem value="log">Log</MenuItem>
						</Select>
					</FormControl>
				)}
			</Box>

			<Divider sx={{ my: 2 }} />

			{/* Eixo X */}
			<Box sx={{ mb: 2 }}>
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
							: sliderBounds(xScale).min,
						xMax !== ""
							? rawToSlider(Number(xMax), xScale)
							: sliderBounds(xScale).max,
					]}
					onChange={(_, val) => {
						const [lo, hi] = val as number[]
						onXMinChange(String(sliderToRaw(lo, xScale)))
						onXMaxChange(String(sliderToRaw(hi, xScale)))
						setIsAdjusting(true)
					}}
					onChangeCommitted={() => setIsAdjusting(false)}
					min={sliderBounds(xScale).min}
					max={sliderBounds(xScale).max}
					step={sliderBounds(xScale).step}
					marks={sliderBounds(xScale).marks}
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

				<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
					<Tooltip title="Voltar ao limite automático">
						<span>
							<IconButton
								size="small"
								disabled={xMin === "" && xMax === ""}
								onClick={() => {
									onXMinChange("")
									onXMaxChange("")
								}}
							>
								<ResetIcon />
							</IconButton>
						</span>
					</Tooltip>
				</Box>
			</Box>

			{/* Eixo Y */}
			{plotMode !== "histogram" && (
				<>
					<Divider sx={{ my: 2 }} />
					<Box sx={{ mb: 2 }}>
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
									: sliderBounds(yScale).min,
								yMax !== ""
									? rawToSlider(Number(yMax), yScale)
									: sliderBounds(yScale).max,
							]}
							onChange={(_, val) => {
								const [lo, hi] = val as number[]
								onYMinChange(String(sliderToRaw(lo, yScale)))
								onYMaxChange(String(sliderToRaw(hi, yScale)))
								setIsAdjusting(true)
							}}
							onChangeCommitted={() => setIsAdjusting(false)}
							min={sliderBounds(yScale).min}
							max={sliderBounds(yScale).max}
							step={sliderBounds(yScale).step}
							marks={sliderBounds(yScale).marks}
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

						<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
							<Tooltip title="Voltar ao limite automático">
								<span>
									<IconButton
										size="small"
										disabled={yMin === "" && yMax === ""}
										onClick={() => {
											onYMinChange("")
											onYMaxChange("")
										}}
									>
										<ResetIcon />
									</IconButton>
								</span>
							</Tooltip>
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
 * Painel de configurações do gráfico: card flutuante (overlay) no canto
 * superior direito do plot — mesmo comportamento no desktop e no mobile.
 * Enquanto o usuário arrasta os sliders de escala/limite, o painel fica
 * translúcido para não tampar o gráfico.
 */
export const PlotSettingsPanel: React.FC<PlotSettingsPanelProps> = ({
	open,
	onClose,
	...controls
}) => {
	const [isAdjusting, setIsAdjusting] = useState(false)

	if (!open) return null

	return (
		<Paper
			sx={(theme) => ({
				position: "absolute",
				top: 12,
				right: 12,
				zIndex: 30,
				width: "min(260px, 80vw)",
				maxHeight: "calc(100% - 24px)",
				overflowY: "auto",
				padding: 1.5,
				borderRadius: 3,
				border: "1px solid",
				borderColor: "divider",
				boxShadow: theme.shadows[8],
				// Overlay transparente durante o ajuste: o plot fica visível
				// atrás do card enquanto o slider mexe o range.
				opacity: isAdjusting ? 0.15 : 1,
				transition: "opacity 150ms ease",
			})}
		>
			<PlotSettingsContent
				{...controls}
				onClose={onClose}
				setIsAdjusting={setIsAdjusting}
			/>
		</Paper>
	)
}

export default PlotSettingsPanel
