import AddIcon from "@mui/icons-material/Add"
import {
	Box,
	Button,
	FormControl,
	FormHelperText,
	Input,
	InputLabel,
	Modal,
	Tooltip,
	Typography,
} from "@mui/material"
import { ChangeEvent, useEffect, useRef, useState } from "react"
import { useExperimentsContext } from "../../../../providers/ExperimentContext"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
export default function NewExperimentCard() {
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
	const [open, setOpen] = useState<boolean>(false)
	const [title, setTitle] = useState<string>("")
	const [experimentType, setExperimentType] = useState<string>("")
	const [disabled, setDisabled] = useState<boolean>(true)
	const [file, setFile] = useState<File | null>(null)

	const { createExperiment } = useExperimentsContext()
	const handleOpen = () => setOpen(true)
	const handleClose = () => {
		setOpen(false)
		setSelectedFileName(null)
		setTitle("")
		setExperimentType("")
	}

	const onSave = async () => {
		if (!file || !title || !experimentType) return
		try {
			await createExperiment(title, experimentType, file)
		} catch (error) {}
		handleClose()
	}

	useEffect(() => {
		if (selectedFileName && title && experimentType) {
			setDisabled(false)
		}
	}, [experimentType, selectedFileName, title])

	const style = {
		width: "25vw",
		bgcolor: "background.paper",
		boxShadow: 12,
		padding: "2rem",
		borderRadius: "1rem",
		display: "flex",
		flexDirection: "column",
		gap: "1rem",
	}

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const file = event.target.files?.[0]
		if (file) {
			setSelectedFileName(file.name)
			setFile(file)
		}
	}

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
						hover: {
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
					<FormControl margin="normal">
						<InputLabel htmlFor="title-input">Experiment Title</InputLabel>
						<Input
							id="title-input"
							aria-describedby="title-helper"
							onChange={(e) => setTitle(e.target.value)}
						/>
						<FormHelperText id="title-helper">
							Field for experiment name
						</FormHelperText>
					</FormControl>
					<FormControl margin="normal">
						<InputLabel htmlFor="type-input">Experiment Type</InputLabel>
						<Input
							id="type-input"
							aria-describedby="type-text"
							onChange={(e) => setExperimentType(e.target.value)}
						/>
						<FormHelperText id="type-text">
							Field for type. Ex: 'Stem Cells'
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
							Upload files
							<input type="file" onChange={handleFileChange} hidden />
						</Button>
						{selectedFileName && (
							<Typography variant="body2" marginTop={2}>
								Selected file: {selectedFileName}
							</Typography>
						)}
						<FormHelperText id="file-helper">
							Field for uploading an experiment file
						</FormHelperText>
					</FormControl>
					<Button
						disabled={disabled}
						variant="contained"
						color="primary"
						onClick={onSave}
					>
						Save
					</Button>
				</Box>
			</Modal>
		</>
	)
}
