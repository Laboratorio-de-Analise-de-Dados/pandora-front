import React from "react"
import {
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
} from "@mui/material"

interface AxisSelectProps {
	value: string
	options: string[]
	onChange: (value: string) => void
	size?: "small" | "medium"
	/** Rótulo flutuante na borda do input (ex.: "X", "Y"). */
	label: string
}

/** Seletor de canal na barra do plot — outlined com o label do eixo na borda. */
const AxisSelect: React.FC<AxisSelectProps> = ({
	value,
	options,
	onChange,
	size = "small",
	label,
}) => (
	<FormControl size={size} variant="outlined">
		<InputLabel id={`axis-select-${label}`}>{label}</InputLabel>
		<Select
			labelId={`axis-select-${label}`}
			value={value}
			label={label}
			onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
			sx={{ fontWeight: 600 }}
		>
			{options.map((option, index) => (
				<MenuItem key={index} value={option}>
					{option}
				</MenuItem>
			))}
		</Select>
	</FormControl>
)

export default AxisSelect
