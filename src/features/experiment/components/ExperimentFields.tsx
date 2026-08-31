import React from "react"
import { FormControl, FormHelperText, Input, InputLabel } from "@mui/material"

interface ExperimentFieldsProps {
	title: string
	type: string
	onTitleChange: (title: string) => void
	onTypeChange: (type: string) => void
	idPrefix?: string
}

/**
 * Campos comuns de experimento (título e tipo), compartilhados entre a criação
 * e a edição para não duplicar rótulos/validações de formulário.
 */
const ExperimentFields: React.FC<ExperimentFieldsProps> = ({
	title,
	type,
	onTitleChange,
	onTypeChange,
	idPrefix = "experiment",
}) => (
	<>
		<FormControl margin="normal" fullWidth>
			<InputLabel htmlFor={`${idPrefix}-title-input`}>
				Experiment Title
			</InputLabel>
			<Input
				id={`${idPrefix}-title-input`}
				aria-describedby={`${idPrefix}-title-helper`}
				value={title}
				onChange={(e) => onTitleChange(e.target.value)}
			/>
			<FormHelperText id={`${idPrefix}-title-helper`}>
				Field for experiment name
			</FormHelperText>
		</FormControl>

		<FormControl margin="normal" fullWidth>
			<InputLabel htmlFor={`${idPrefix}-type-input`}>
				Experiment Type
			</InputLabel>
			<Input
				id={`${idPrefix}-type-input`}
				aria-describedby={`${idPrefix}-type-helper`}
				value={type}
				onChange={(e) => onTypeChange(e.target.value)}
			/>
			<FormHelperText id={`${idPrefix}-type-helper`}>
				Field for type. Ex: 'Stem Cells'
			</FormHelperText>
		</FormControl>
	</>
)

export default ExperimentFields
