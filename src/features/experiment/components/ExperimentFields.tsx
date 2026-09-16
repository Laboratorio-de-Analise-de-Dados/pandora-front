import React from "react"
import { FormControl, FormHelperText, Input, InputLabel } from "@mui/material"

interface ExperimentFieldsProps {
	title: string
	type: string
	description: string
	onTitleChange: (title: string) => void
	onTypeChange: (type: string) => void
	onDescriptionChange: (description: string) => void
	idPrefix?: string
}

/**
 * Campos comuns de experimento (título, tipo e descrição opcional),
 * compartilhados entre a criação e a edição para não duplicar
 * rótulos/validações de formulário.
 */
const ExperimentFields: React.FC<ExperimentFieldsProps> = ({
	title,
	type,
	description,
	onTitleChange,
	onTypeChange,
	onDescriptionChange,
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

		<FormControl margin="normal" fullWidth>
			<InputLabel htmlFor={`${idPrefix}-description-input`}>
				Descrição
			</InputLabel>
			<Input
				id={`${idPrefix}-description-input`}
				aria-describedby={`${idPrefix}-description-helper`}
				value={description}
				onChange={(e) => onDescriptionChange(e.target.value)}
				multiline
				minRows={2}
				maxRows={5}
			/>
			<FormHelperText id={`${idPrefix}-description-helper`}>
				Opcional — contexto, objetivo ou observações do experimento
			</FormHelperText>
		</FormControl>
	</>
)

export default ExperimentFields
