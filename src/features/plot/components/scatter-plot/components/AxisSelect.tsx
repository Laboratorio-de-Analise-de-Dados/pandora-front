import React from "react"
import { MenuItem, Select, SelectChangeEvent } from "@mui/material"

interface AxisSelectProps {
	value: string
	options: string[]
	onChange: (value: string) => void
	/** Eixo Y aparece girado 90° à esquerda do gráfico no desktop. */
	rotated?: boolean
	fullWidth?: boolean
}

const AxisSelect: React.FC<AxisSelectProps> = ({
	value,
	options,
	onChange,
	rotated = false,
	fullWidth = false,
}) => (
	<Select
		value={value}
		onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
		fullWidth={fullWidth}
		sx={rotated ? { transform: "rotate(-90deg)" } : undefined}
	>
		{options.map((option, index) => (
			<MenuItem key={index} value={option}>
				{option}
			</MenuItem>
		))}
	</Select>
)

export default AxisSelect
