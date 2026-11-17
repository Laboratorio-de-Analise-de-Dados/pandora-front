import React from "react"
import {
	Box,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	SelectChangeEvent,
	Tooltip,
} from "@mui/material"
import { MdEdit as EditIcon } from "react-icons/md"

interface AxisSelectProps {
	value: string
	options: string[]
	onChange: (value: string) => void
	size?: "small" | "medium"
	/** Rótulo flutuante na borda do input (ex.: "X", "Y"). */
	label: string
	/** FE-51: lápis por opção abre o rename do canal — ausente = opções
	 * sem affordance de edição (sem permissão). */
	onRenameChannel?: (channel: string) => void
}

/** Seletor de canal na barra do plot — outlined com o label do eixo na borda. */
const AxisSelect: React.FC<AxisSelectProps> = ({
	value,
	options,
	onChange,
	size = "small",
	label,
	onRenameChannel,
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
					{onRenameChannel ? (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								width: "100%",
							}}
						>
							<Box component="span" sx={{ flex: 1 }}>
								{option}
							</Box>
							<Tooltip title="Renomear canal…">
								<IconButton
									size="small"
									onClick={(e) => {
										// Sem isso o clique no lápis seleciona a opção.
										e.stopPropagation()
										onRenameChannel(option)
									}}
									sx={{ p: 0.25 }}
								>
									<EditIcon style={{ fontSize: 12, opacity: 0.6 }} />
								</IconButton>
							</Tooltip>
						</Box>
					) : (
						option
					)}
				</MenuItem>
			))}
		</Select>
	</FormControl>
)

export default AxisSelect
