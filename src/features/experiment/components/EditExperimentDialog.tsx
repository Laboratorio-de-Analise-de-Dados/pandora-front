import React, { useEffect, useState } from "react"
import {
	Alert,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormHelperText,
	InputLabel,
	Typography,
} from "@mui/material"
import type { Experiment } from "../../../types"
import type { UpdateExperimentPayload } from "../../../services/experimentService"
import { useAuth } from "../../../providers/AuthContext"
import ExperimentFields from "./ExperimentFields"

interface EditExperimentDialogProps {
	open: boolean
	experiment: Experiment
	saving: boolean
	error: string | null
	onClose: () => void
	onSave: (payload: UpdateExperimentPayload) => void
}

const EditExperimentDialog: React.FC<EditExperimentDialogProps> = ({
	open,
	experiment,
	saving,
	error,
	onClose,
	onSave,
}) => {
	const { user } = useAuth()
	// BE-28: tipo novo no vocabulário só para admin ou dono — membro
	// editando experimento alheio escolhe entre os existentes.
	const canCreateType = Boolean(
		user && (user.is_super_admin || experiment.created_by === user.id),
	)
	const [title, setTitle] = useState(experiment.title)
	const [type, setType] = useState(experiment.type)
	const [description, setDescription] = useState(experiment.description ?? "")

	useEffect(() => {
		if (!open) return
		setTitle(experiment.title)
		setType(experiment.type)
		setDescription(experiment.description ?? "")
	}, [open, experiment])

	const values = experiment.values ?? []

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
					description={description}
					onTitleChange={setTitle}
					onTypeChange={setType}
					onDescriptionChange={setDescription}
					canCreateType={canCreateType}
					idPrefix="edit-experiment"
				/>
				{/* Canais são derivados dos arquivos do experimento e re-computados
					a cada extração — exibidos somente leitura (BE-24). */}
				<FormControl margin="normal" fullWidth>
					<InputLabel shrink htmlFor="edit-experiment-values">
						Marcadores / values
					</InputLabel>
					<Box
						id="edit-experiment-values"
						sx={{
							display: "flex",
							flexWrap: "wrap",
							gap: 0.5,
							mt: 3,
							minHeight: 32,
							alignItems: "center",
						}}
					>
						{values.length > 0 ? (
							values.map((value) => (
								<Chip size="small" label={value} key={value} />
							))
						) : (
							<Typography variant="body2" color="text.secondary">
								Nenhum canal ainda — suba um arquivo para extrair
							</Typography>
						)}
					</Box>
					<FormHelperText>
						Derivados dos arquivos do experimento — não editável
					</FormHelperText>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					variant="contained"
					disabled={saving || !title.trim() || !type.trim()}
					onClick={() =>
						onSave({
							title: title.trim(),
							type: type.trim(),
							description: description.trim(),
						})
					}
				>
					{saving ? "Salvando..." : "Salvar"}
				</Button>
			</DialogActions>
		</Dialog>
	)
}

export default EditExperimentDialog
