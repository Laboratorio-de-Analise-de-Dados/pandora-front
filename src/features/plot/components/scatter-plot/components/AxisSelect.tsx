import React from "react"
import { MenuItem, Select, SelectChangeEvent } from "@mui/material"

interface AxisSelectProps {
	value: string
	options: string[]
	onChange: (value: string) => void
	size?: "small" | "medium"
}

/** Seletor de canal na barra superior do plot — texto + chevron, sem caixa. */
const AxisSelect: React.FC<AxisSelectProps> = ({
	value,
	options,
	onChange,
	size = "small",
}) => (
	<Select
		value={value}
		onChange={(e: SelectChangeEvent<string>) => onChange(e.target.value)}
		size={size}
		variant="standard"
		disableUnderline
		sx={{ fontWeight: 600 }}
	>
		{options.map((option, index) => (
			<MenuItem key={index} value={option}>
				{option}
			</MenuItem>
		))}
	</Select>
)

export default AxisSelect
