import React, { useState } from "react"
import {
	MdExpandMore as ExpandMoreIcon,
	MdClose as CloseIcon,
	MdSettings as SettingsIcon,
} from "react-icons/md"
import {
	Box,
	Button,
	Divider,
	IconButton,
	Paper,
	Slider,
	TextField,
	FormControlLabel,
	Checkbox,
	Tooltip,
	Typography,
	Fade,
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

interface PlotSettingsDropdownProps {
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

/**
 * Dropdown flutuante para configurações de gráfico
 * Sobrepõe o gráfico e não ocupa espaço
 * Mostra preview em tempo real das mudanças
 */
export const PlotSettingsDropdown: React.FC<PlotSettingsDropdownProps> = ({
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
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [isAdjusting, setIsAdjusting] = useState(false)
	return (
		<Box sx={{ position: "relative", width: "100%" }}>
			{/* Botão flutuante */}
			<Tooltip title={isOpen ? "Fechar configurações" : "Abrir configurações"}>
				<IconButton
					onClick={() => setIsOpen(!isOpen)}
					size="small"
					sx={{
						position: "absolute",
						top: 8,
						right: 8,
						zIndex: 10,
						backgroundColor: "rgba(255, 255, 255, 0.6)",
						backdropFilter: "blur(2px)",
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

			{/* Dropdown Panel */}
			<Fade in={isOpen} timeout={200}>
				<Paper
					sx={{
						position: "absolute",
						top: 50,
						left: "calc(80%)", // abre para o lado direito
						zIndex: 30,
						width: 280,
						maxHeight: "30vh",
						overflowY: "auto",
						padding: 1.5,
						borderRadius: 8,
						backdropFilter: "blur(6px)",
						boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
						border: "1px solid",
						borderColor: "divider",
					}}
					style={{
						opacity: isAdjusting ? 0.3 : 1,
					}}
				>
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
						<IconButton size="small" onClick={() => setIsOpen(false)}>
							<CloseIcon style={{ fontSize: "18px" }} />
						</IconButton>
					</Box>

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
							marks={
								xScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS
							}
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
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => onXMinChange(e.target.value)}
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
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => onXMaxChange(e.target.value)}
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
									marks={
										yScale === "biex" ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS
									}
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
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => onYMinChange(e.target.value)}
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
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => onYMaxChange(e.target.value)}
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
				</Paper>
			</Fade>
		</Box>
	)
}

export default PlotSettingsDropdown
