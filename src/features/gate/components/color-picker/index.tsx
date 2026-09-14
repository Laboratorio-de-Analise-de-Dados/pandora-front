import React, { useState } from "react"
import { Box, Popover, TextField, IconButton } from "@mui/material"
import { GATE_PALETTE } from "../../../../constants/gateColors"

interface ColorPickerProps {
	value: string
	onChange: (color: string) => void
}

const isValidHex = (v: string) => /^#[0-9A-Fa-f]{6}$/.test(v)

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
	const [hexInput, setHexInput] = useState(value)

	const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
		setAnchorEl(e.currentTarget)

	const handleClose = () => setAnchorEl(null)

	const handleSwatchClick = (color: string) => {
		onChange(color)
		setHexInput(color)
		handleClose()
	}

	const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const v = e.target.value
		setHexInput(v)
		if (isValidHex(v)) onChange(v)
	}

	return (
		<>
			<IconButton
				onClick={handleOpen}
				sx={{
					width: 28,
					height: 28,
					borderRadius: "4px",
					border: "2px solid",
					borderColor: "divider",
					backgroundColor: value,
					"&:hover": { backgroundColor: value, opacity: 0.85 },
				}}
				title="Escolher cor"
			/>
			<Popover
				open={!!anchorEl}
				anchorEl={anchorEl}
				onClose={handleClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
				transformOrigin={{ vertical: "top", horizontal: "left" }}
			>
				<Box sx={{ p: 1.5, width: 200 }}>
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: "repeat(6, 1fr)",
							gap: 0.5,
							mb: 1,
						}}
					>
						{GATE_PALETTE.map((color) => (
							<Box
								key={color}
								onClick={() => handleSwatchClick(color)}
								sx={{
									width: 26,
									height: 26,
									borderRadius: "4px",
									backgroundColor: color,
									cursor: "pointer",
									border:
										color === value
											? "2px solid #000"
											: "2px solid transparent",
									"&:hover": { opacity: 0.8, border: "2px solid #666" },
								}}
							/>
						))}
					</Box>
					<TextField
						size="small"
						fullWidth
						label="Hex"
						value={hexInput}
						onChange={handleHexChange}
						placeholder="#000000"
						inputProps={{ maxLength: 7 }}
						error={hexInput.length > 0 && !isValidHex(hexInput)}
					/>
				</Box>
			</Popover>
		</>
	)
}
