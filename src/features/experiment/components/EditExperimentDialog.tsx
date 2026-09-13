import React, { useEffect, useState } from "react"
import {
	Alert,
	Autocomplete,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
} from "@mui/material"
import type { Experiment } from "../../../types"
import ExperimentFields from "./ExperimentFields"

interface EditExperimentDialogProps {
	open: boolean
	experiment: Experiment
	saving: boolean
	error: string | null
	onClose: () => void
	onSave: (payload: { title: string; type: string; values: string[] }) => void
}

const EditExperimentDialog: React.FC<EditExperimentDialogProps> = ({
	open,
	experiment,
	saving,
	error,
	onClose,
	onSave,
}) => {
	const [title, setTitle] = useState(experiment.title)
	const [type, setType] = useState(experiment.type)
	const [values, setValues] = useState<string[]>(experiment.values ?? [])

	useEffect(() => {
		if (!open) return
		setTitle(experiment.title)
		setType(experiment.type)
		setValues(experiment.values ?? [])
	}, [open, experiment])

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Editar experimento</DialogTitle>
			<DialogContent>
				{error && (
					<Alert severity="error" sx={{ mb: 1 }}>
						{error}
					</Alert>
				)}
				<ExperimentFields
					title={title}
					type={type}
					onTitleChange={setTitle}
					onTypeChange={setType}
					idPrefix="edit-experiment"
				/>
				<Autocomplete
					multiple
					freeSolo
					options={[]}
					value={values}
					onChange={(_, next) => setValues(next as string[])}
					renderTags={(tagValues, getTagProps) =>
						tagValues.map((value, index) => (
							<Chip
								size="small"
								label={value}
								{...getTagProps({ index })}
								key={`${value}-${index}`}
							/>
						))
					}
					renderInput={(params) => (
						<TextField
							{...params}
							variant="standard"
							label="Marcadores / values"
							helperText="Enter para adicionar cada marcador"
						/>
					)}
					sx={{ mt: 2 }}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					variant="contained"
					disabled={saving || !title.trim() || !type.trim()}
					onClick={() =>
						onSave({ title: title.trim(), type: type.trim(), values })
					}
				>
					{saving ? "Salvando..." : "Salvar"}
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default EditExperimentDialog
