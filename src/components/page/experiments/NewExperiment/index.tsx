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
import { ChangeEvent, useRef, useState } from "react"

export default function NewExperimentCard() {
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
	const [open, setOpen] = useState<boolean>(false)
	const handleOpen = () => setOpen(true)
	const handleClose = () => setOpen(false)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const style = {
		width: "25vw",
		bgcolor: "background.paper",
		boxShadow: 12,
		padding: "2rem",
		borderRadius: "1rem",
		display: "flex",
		flexWrap: "wrap",
		gap: "1rem",
	}

	const handleFileUploadClick = () => {
		if (fileInputRef.current) {
			fileInputRef.current.click()
		}
	}

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const file = event.target.files?.[0]
		if (file) {
			setSelectedFileName(file.name)
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
						<Input id="title-input" aria-describedby="title-helper" />
						<FormHelperText id="title-helper">
							Field for experiment name
						</FormHelperText>
					</FormControl>
					<FormControl margin="normal">
						<InputLabel htmlFor="type-input">Experiment Type</InputLabel>
						<Input id="type-input" aria-describedby="type-text" />
						<FormHelperText id="type-text">
							Field for type. Ex: 'Stem Cells'
						</FormHelperText>
					</FormControl>
					<FormControl margin="normal">
						<Input
							type="file"
							id="file-input"
							inputRef={fileInputRef}
							onChange={handleFileChange}
							style={{ display: "none" }}
						/>
						<Button
							variant="contained"
							color="primary"
							onClick={handleFileUploadClick}
						>
							Choose File
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
				</Box>
			</Modal>
		</>
	)
}
