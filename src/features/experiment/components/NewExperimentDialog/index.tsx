import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import {
	Box,
	Button,
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
	const [organizationId, setOrganizationId] = useState("")
	const [file, setFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState(false)

	const { createExperiment, progress } = useExperimentsContext()
	const { user } = useAuth()

	useEffect(() => {
		if (!open) {
			setSelectedFileName(null)
			setTitle("")
			setExperimentType("")
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
		if (!file || !title || !experimentType) return
		try {
			setUploading(true)
			const orgId = organizationId === "" ? null : parseInt(organizationId, 10)
			await createExperiment(title, experimentType, file, orgId)
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
	const disabled = !selectedFileName || !title || !experimentType

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
					onTitleChange={setTitle}
					onTypeChange={setExperimentType}
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

				<FormControl margin="normal">
					<Button
						component="label"
						variant="contained"
						tabIndex={-1}
						startIcon={<CloudUploadIcon />}
					>
						Upload file
						<input
							type="file"
							accept={ACCEPTED_EXPERIMENT_FILE_ACCEPT}
							onChange={handleFileChange}
							hidden
						/>
					</Button>
					<Typography variant="caption" marginTop={1}>
						Formatos aceitos: .fcs ou .zip
					</Typography>
					{selectedFileName && (
						<Typography variant="body2" marginTop={1}>
							{selectedFileName}
						</Typography>
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
