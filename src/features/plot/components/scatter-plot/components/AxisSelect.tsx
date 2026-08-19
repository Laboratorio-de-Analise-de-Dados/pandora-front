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
	/** Eixo Y aparece girado 90° à esquerda do gráfico no desktop. */
	rotated?: boolean
	fullWidth?: boolean
	size?: "small" | "medium"
	label?: string
}

const AxisSelect: React.FC<AxisSelectProps> = ({
	value,
	options,
	onChange,
	rotated = false,
	fullWidth = false,
	size = "medium",
	label,
}) => {
	const selectId = label ? `axis-select-${label.replace(/\s+/g, "-")}` : undefined
	const select = (
		<Select
			value={value}
			onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
			fullWidth={fullWidth}
			size={size}
			labelId={selectId}
			label={label}
			sx={rotated ? { transform: "rotate(-90deg)" } : undefined}
		>
			{options.map((option, index) => (
				<MenuItem key={index} value={option}>
					{option}
				</MenuItem>
			))}
		</Select>
	)

	if (!label) return select

	return (
		<FormControl fullWidth={fullWidth} size={size}>
			<InputLabel id={selectId}>{label}</InputLabel>
			{select}
		</FormControl>
	)
}

export default AxisSelect
