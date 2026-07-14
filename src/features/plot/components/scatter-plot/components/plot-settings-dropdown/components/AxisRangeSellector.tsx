import { Box, Slider, TextField, Typography } from "@mui/material"
import {
	BIEX_SLIDER_MARKS,
	BIEX_SLIDER_MAX,
	BIEX_SLIDER_MIN,
	LINEAR_SLIDER_MARKS,
	LINEAR_SLIDER_MAX,
	rawToSlider,
	sliderToRaw,
} from "../../../../../utils/sliders"
import { AxisRangeSelectorProps } from "../types"

export const AxisRangeSelector: React.FC<AxisRangeSelectorProps> = ({
	label,
	scale,
	min,
	max,
	onMinChange,
	onMaxChange,
	setIsAdjusting,
}) => {
	const isBiex = scale === "biex"
	const sliderMin = isBiex ? BIEX_SLIDER_MIN : 0
	const sliderMax = isBiex ? BIEX_SLIDER_MAX : LINEAR_SLIDER_MAX

	const sliderValue = [
		min !== "" ? rawToSlider(Number(min), scale) : sliderMin,
		max !== "" ? rawToSlider(Number(max), scale) : sliderMax,
	]

	return (
		<Box sx={{ mb: 2 }}>
			<Typography
				variant="caption"
				fontWeight="bold"
				color="text.secondary"
				sx={{ mb: 1, display: "block" }}
			>
				{label}
			</Typography>
			<Slider
				value={sliderValue}
				onChange={(_, val) => {
					const [lo, hi] = val as number[]
					onMinChange(String(sliderToRaw(lo, scale)))
					onMaxChange(String(sliderToRaw(hi, scale)))
					setIsAdjusting(true)
				}}
				onChangeCommitted={() => setIsAdjusting(false)}
				min={sliderMin}
				max={sliderMax}
				step={isBiex ? 0.01 : 500}
				marks={isBiex ? BIEX_SLIDER_MARKS : LINEAR_SLIDER_MARKS}
				valueLabelDisplay="auto"
				valueLabelFormat={(v) => {
					const raw = sliderToRaw(v, scale)
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
					value={min}
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
}
