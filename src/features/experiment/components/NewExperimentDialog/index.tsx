import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
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
	LinearProgress,
	MenuItem,
	Select,
	Typography,
} from "@mui/material"
import { MdCloudUpload as CloudUploadIcon } from "react-icons/md"
import { useExperimentsContext } from "../../../../providers/ExperimentContext"
import { useAuth } from "../../../../providers/AuthContext"
import ExperimentFields from "../ExperimentFields"
import {
	ACCEPTED_EXPERIMENT_FILE_ACCEPT,
	ACCEPTED_EXPERIMENT_FILE_MESSAGE,
	isAcceptedExperimentFile,
} from "../../../../utils/experimentFile"
import { extractErrorMessage } from "../../../../utils/apiError"

interface NewExperimentDialogProps {
	open: boolean
	onClose: () => void
}

/**
 * Dialog de criação de experimento (título, tipo, contexto/lab, upload .fcs/.zip).
 * Compartilhado pelo card "Novo experimento" da grade e pelo botão
 * "+ Novo Experimento" do cabeçalho da listagem (FE-26).
 */
export default function NewExperimentDialog({
	open,
	onClose,
}: NewExperimentDialogProps) {
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
	const [title, setTitle] = useState("")
	const [experimentType, setExperimentType] = useState("")
	const [description, setDescription] = useState("")
	const [organizationId, setOrganizationId] = useState("")
	const [file, setFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)

	const { createExperiment, createExperimentEmpty, progress } =
		useExperimentsContext()
	const { user } = useAuth()

	useEffect(() => {
		if (!open) {
			setSelectedFileName(null)
			setTitle("")
			setExperimentType("")
			setDescription("")
			setOrganizationId("")
			setFile(null)
			setUploading(false)
		}
	}, [open])

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selected = event.target.files?.[0]
		event.target.value = ""
		if (!selected) return

		if (!isAcceptedExperimentFile(selected.name)) {
			toast.error(ACCEPTED_EXPERIMENT_FILE_MESSAGE)
			setSelectedFileName(null)
			setFile(null)
			return
		}
		setSelectedFileName(selected.name)
		setFile(selected)
	}

	const onSave = async () => {
		if (!title || !experimentType) return
		try {
			setUploading(true)
			const orgId = organizationId === "" ? null : parseInt(organizationId, 10)
			if (file) {
				await createExperiment(title, experimentType, file, orgId, description)
			} else {
				await createExperimentEmpty(title, experimentType, orgId, description)
			}
			onClose()
		} catch (error) {
			toast.error(extractErrorMessage(error) || "Erro ao criar experimento.")
		} finally {
			setUploading(false)
		}
	}

	const uploadedChunks = progress.filter(
		(c: { status?: string }) => c.status === "uploaded",
	).length
	const percent =
		progress.length > 0
			? Math.round((uploadedChunks / progress.length) * 100)
			: 0

	const memberships = user?.memberships || []
	const disabled = !title.trim() || !experimentType.trim()

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Novo experimento</DialogTitle>
			<DialogContent>
				<ExperimentFields
					title={title}
					type={experimentType}
					description={description}
					onTitleChange={setTitle}
					onTypeChange={setExperimentType}
					onDescriptionChange={setDescription}
					idPrefix="new-experiment"
				/>

				<FormControl margin="normal" fullWidth>
					<InputLabel id="org-label">Contexto / Lab</InputLabel>
					<Select
						labelId="org-label"
						value={organizationId}
						label="Contexto / Lab"
						onChange={(e) => setOrganizationId(e.target.value)}
					>
						<MenuItem value="">
							<em>Pessoal (sem lab)</em>
						</MenuItem>
						{memberships.map((m) => (
							<MenuItem key={m.organization.id} value={m.organization.id}>
								{m.organization.name}
							</MenuItem>
						))}
					</Select>
					<FormHelperText>
						Escolha se o experimento é pessoal ou de um lab
					</FormHelperText>
				</FormControl>

				<FormControl margin="normal" fullWidth>
					<Button
						component="label"
						variant="contained"
						tabIndex={-1}
						startIcon={<CloudUploadIcon />}
						sx={{ alignSelf: "flex-start" }}
					>
						{selectedFileName ? "Trocar arquivo" : "Upload file (opcional)"}
						<input
							type="file"
							accept={ACCEPTED_EXPERIMENT_FILE_ACCEPT}
							onChange={handleFileChange}
							hidden
						/>
					</Button>
					<Typography variant="caption" marginTop={1}>
						Formatos aceitos: .fcs ou .zip — também dá para adicionar amostras
						depois, dentro do experimento
					</Typography>
					{selectedFileName && (
						<Chip
							size="small"
							label={selectedFileName}
							onDelete={() => {
								setFile(null)
								setSelectedFileName(null)
							}}
							sx={{ mt: 1, alignSelf: "flex-start" }}
						/>
					)}
				</FormControl>

				{uploading && progress.length > 0 && (
					<Box sx={{ mt: 2 }}>
						<LinearProgress variant="determinate" value={percent} />
						<Typography variant="caption">{percent}% uploaded</Typography>
					</Box>
				)}
			</DialogContent>
			<DialogActions sx={{ p: 2 }}>
				<Button onClick={onClose} disabled={uploading}>
					Cancelar
				</Button>
				<Button
					disabled={disabled || uploading}
					variant="contained"
					onClick={onSave}
				>
					{uploading ? "Enviando..." : "Salvar"}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
