import { MdAdd as AddIcon } from "react-icons/md"
import { MdCloudUpload as CloudUploadIcon } from "react-icons/md"
import {
	Box,
	Button,
	FormControl,
	FormHelperText,
	InputLabel,
	LinearProgress,
	MenuItem,
	Modal,
	Select,
	Tooltip,
	Typography,
} from "@mui/material"
import { ChangeEvent, useEffect, useState } from "react"
import { toast } from "react-toastify"
import { useExperimentsContext } from "../../../providers/ExperimentContext"
import { useAuth } from "../../../providers/AuthContext"
import ExperimentFields from "../../../features/experiment/components/ExperimentFields"
import {
	ACCEPTED_EXPERIMENT_FILE_ACCEPT,
	ACCEPTED_EXPERIMENT_FILE_MESSAGE,
	isAcceptedExperimentFile,
} from "../../../utils/experimentFile"
import { extractErrorMessage } from "../../../utils/apiError"

export default function NewExperimentCard() {
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
	const [open, setOpen] = useState<boolean>(false)
	const [title, setTitle] = useState<string>("")
	const [experimentType, setExperimentType] = useState<string>("")
	const [organizationId, setOrganizationId] = useState<string>("")
	const [disabled, setDisabled] = useState<boolean>(true)
	const [file, setFile] = useState<File | null>(null)
	const [uploading, setUploading] = useState<boolean>(false)

	const { createExperiment, progress } = useExperimentsContext()
	const { user } = useAuth()

	const handleOpen = () => setOpen(true)
	const handleClose = () => {
		setOpen(false)
		setSelectedFileName(null)
		setTitle("")
		setExperimentType("")
		setOrganizationId("")
		setFile(null)
		setUploading(false)
	}

	const onSave = async () => {
		if (!file || !title || !experimentType) return
		try {
			setUploading(true)
			const orgId = organizationId === "" ? null : parseInt(organizationId, 10)
			await createExperiment(title, experimentType, file, orgId)
		} catch (error) {
			console.error("Erro ao criar experimento:", error)
			toast.error(extractErrorMessage(error) || "Erro ao criar experimento.")
		} finally {
			setUploading(false)
			handleClose()
		}
	}

	useEffect(() => {
		if (selectedFileName && title && experimentType) {
			setDisabled(false)
		} else {
			setDisabled(true)
		}
	}, [experimentType, selectedFileName, title])

	const style = {
		width: { xs: "90vw", sm: "50vw", md: "35vw", lg: "25vw" },
		maxWidth: 560,
		maxHeight: "90vh",
		overflowY: "auto",
		bgcolor: "background.paper",
		boxShadow: 12,
		padding: { xs: "1rem", sm: "2rem" },
		borderRadius: "1rem",
		display: "flex",
		flexDirection: "column",
		gap: "1rem",
	}

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
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

	// calcula progresso geral
	const uploadedChunks = progress.filter(
		(c: any) => c.status === "uploaded",
	).length
	const totalChunks = progress.length
	const percent =
		totalChunks > 0 ? Math.round((uploadedChunks / totalChunks) * 100) : 0

	const memberships = user?.memberships || []

	return (
		<>
			<Tooltip title="New Experiment">
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						width: "10rem",
						border: "0.2rem dotted #001f36",
						padding: "1rem",
						borderRadius: "15px",
						"&:hover": {
							color: "#79ae92",
							borderColor: "#79ae92",
							cursor: "pointer",
						},
					}}
					onClick={handleOpen}
				>
					<AddIcon />
				</Box>
			</Tooltip>
			<Modal
				open={open}
				onClose={handleClose}
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Box sx={style}>
					<Typography variant="h6" mb={1}>
						Novo experimento
					</Typography>

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
							{memberships.map((m: any) => (
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
							role={undefined}
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
							<Typography variant="body2" marginTop={2}>
								Selected file: {selectedFileName}
							</Typography>
						)}
						<FormHelperText id="file-helper">
							Field for uploading an experiment file
						</FormHelperText>
					</FormControl>

					{uploading && totalChunks > 0 && (
						<Box sx={{ mt: 2 }}>
							<LinearProgress variant="determinate" value={percent} />
							<Typography variant="caption">{percent}% uploaded</Typography>
						</Box>
					)}

					<Button
						disabled={disabled || uploading}
						variant="contained"
						color="primary"
						onClick={onSave}
					>
						{uploading ? "Uploading..." : "Save"}
					</Button>
				</Box>
			</Modal>
		</>
	)
}
