import React from "react"
import {
	Autocomplete,
	Box,
	createFilterOptions,
	FormControl,
	FormHelperText,
	Input,
	InputLabel,
	TextField,
} from "@mui/material"
import { MdAdd as AddIcon } from "react-icons/md"
import { useExperimentTypes } from "../hooks/useExperimentTypes"

interface ExperimentFieldsProps {
	title: string
	type: string
	description: string
	onTitleChange: (title: string) => void
	onTypeChange: (type: string) => void
	onDescriptionChange: (description: string) => void
	/** BE-28: criar tipo novo exige admin (super ou org_admin da org do
	 * experimento) ou dono — quando false, o autocomplete não oferece a
	 * opção `Criar "X"` (default true: na criação o usuário é o dono). */
	canCreateType?: boolean
	idPrefix?: string
}

const CREATE_PREFIX = 'Criar "'

/** Normalização igual à do backend (ADR-0022): whitespace colapsado +
 * lowercase — "Stem Cell" e "stem  cell" são o mesmo tipo. */
const normalizeTypeName = (value: string) =>
	value.trim().split(/\s+/).join(" ").toLowerCase()

const isCreateOption = (option: string) =>
	option.startsWith(CREATE_PREFIX) && option.endsWith('"')

const stripCreatePrefix = (option: string) =>
	isCreateOption(option) ? option.slice(CREATE_PREFIX.length, -1) : option

const typeFilter = createFilterOptions<string>()

/**
 * Campos comuns de experimento (título, tipo e descrição opcional),
 * compartilhados entre a criação e a edição para não duplicar
 * rótulos/validações de formulário.
 *
 * O tipo é um autocomplete freeSolo (BE-28): sugere os tipos existentes do
 * vocabulário e oferece `Criar "X"` quando o texto não casa com nenhum —
 * o registro só é criado no backend quando o experimento usa o tipo.
 */
const ExperimentFields: React.FC<ExperimentFieldsProps> = ({
	title,
	type,
	description,
	onTitleChange,
	onTypeChange,
	onDescriptionChange,
	canCreateType = true,
	idPrefix = "experiment",
}) => {
	const { data: experimentTypes = [], isLoading } = useExperimentTypes()
	const typeOptions = experimentTypes.map((t) => t.name)

	return (
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

			<Autocomplete
				freeSolo
				options={typeOptions}
				loading={isLoading}
				inputValue={type}
				onInputChange={(_, newInputValue, reason) => {
					// "reset" acompanha a seleção — o onChange já cobre.
					if (reason === "input" || reason === "clear") {
						onTypeChange(newInputValue)
					}
				}}
				onChange={(_, newValue) => {
					if (typeof newValue === "string") {
						onTypeChange(stripCreatePrefix(newValue))
					}
				}}
				filterOptions={(options, params) => {
					const filtered = typeFilter(options, params)
					const input = params.inputValue.trim()
					const alreadyExists = options.some(
						(option) => normalizeTypeName(option) === normalizeTypeName(input),
					)
					if (input !== "" && !alreadyExists && canCreateType) {
						filtered.push(`${CREATE_PREFIX}${input}"`)
					}
					return filtered
				}}
				renderOption={(props, option) => {
					const { key, ...rest } = props
					return (
						<li key={key} {...rest}>
							{isCreateOption(option) ? (
								<Box
									component="span"
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.5,
									}}
								>
									<AddIcon size={14} />
									{option}
								</Box>
							) : (
								option
							)}
						</li>
					)
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						variant="standard"
						margin="normal"
						label="Experiment Type"
						helperText={
							canCreateType
								? "Escolha um tipo existente ou digite um novo para criar"
								: "Escolha um tipo existente — criar tipos exige ser dono do experimento ou admin"
						}
						id={`${idPrefix}-type-input`}
					/>
				)}
			/>

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
}

export default ExperimentFields
