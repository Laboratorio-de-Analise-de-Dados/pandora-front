import React, { useEffect, useState } from "react"
import {
	Box,
	Checkbox,
	Divider,
	FormControlLabel,
	Slider,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material"
import { usePlotContext } from "../context/PlotStateContext"
import {
	BIEX_SLIDER_MARKS,
	BIEX_SLIDER_MAX,
	BIEX_SLIDER_MIN,
	LINEAR_SLIDER_MARKS,
	LINEAR_SLIDER_MAX,
	rawToSlider,
	sliderToRaw,
} from "../utils/sliders"

interface PlotConfigPanelProps {
	onAdjustingChange?: (adjusting: boolean) => void
}

export default function PlotConfigPanel({
	onAdjustingChange,
}: PlotConfigPanelProps) {
	const {
		plotMode,
		xScale,
		yScale,
		cutoff,
		xMin,
		xMax,
		yMin,
		yMax,
		setPlotMode,
		setXScale,
		setYScale,
		setCutoff,
		setXMin,
		setXMax,
		setYMin,
		setYMax,
	} = usePlotContext()

	const [isAdjusting, setIsAdjusting] = useState(false)

	useEffect(() => {
		onAdjustingChange?.(isAdjusting)
	}, [isAdjusting, onAdjustingChange])

	useEffect(() => {
		return () => {
			onAdjustingChange?.(false)
		}
	}, [onAdjustingChange])

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
			<Typography variant="subtitle2" fontWeight="bold">
				Configurações do Gráfico
			</Typography>

			{/* Tipo de gráfico */}
			<Box>
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
						if (mode) setPlotMode(mode)
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

			<Divider />

			{/* Escala */}
			<Box>
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
							onChange={(e) => setXScale(e.target.checked ? "biex" : "linear")}
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
									setYScale(e.target.checked ? "biex" : "linear")
								}
								size="small"
							/>
						}
						label={<Typography variant="caption">Y Biex</Typography>}
					/>
				)}
			</Box>

			<Divider />

			{/* Eixo X */}
			<Box>
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
						setXMin(String(sliderToRaw(lo, xScale)))
						setXMax(String(sliderToRaw(hi, xScale)))
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
						onFocus={() => setIsAdjusting(true)}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setXMin(e.target.value)
						}
						onBlur={() => setIsAdjusting(false)}
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
						onFocus={() => setIsAdjusting(true)}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							setXMax(e.target.value)
						}
						onBlur={() => setIsAdjusting(false)}
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
					<Divider />
					<Box>
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
								setYMin(String(sliderToRaw(lo, yScale)))
								setYMax(String(sliderToRaw(hi, yScale)))
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
								onFocus={() => setIsAdjusting(true)}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setYMin(e.target.value)
								}
								onBlur={() => setIsAdjusting(false)}
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
								onFocus={() => setIsAdjusting(true)}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setYMax(e.target.value)
								}
								onBlur={() => setIsAdjusting(false)}
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
					<Divider />
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
							onFocus={() => setIsAdjusting(true)}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setCutoff(Math.max(0, Number(e.target.value) || 0))
							}
							onBlur={() => setIsAdjusting(false)}
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
		</Box>
	)
}
