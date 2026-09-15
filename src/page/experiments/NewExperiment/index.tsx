import { useState } from "react"
import { MdAdd as AddIcon } from "react-icons/md"
import { Box, Tooltip, Typography } from "@mui/material"
import NewExperimentDialog from "../../../features/experiment/components/NewExperimentDialog"

export default function NewExperimentCard() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<Tooltip title="New Experiment">
				<Box
					component="li"
					sx={(theme) => ({
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						flex: "1 1 15rem",
						maxWidth: "24rem",
						minHeight: "8rem",
						border: `1px dashed ${theme.palette.divider}`,
						color: theme.palette.text.secondary,
						padding: "1rem",
						borderRadius: "16px",
						transition: "border-color 180ms ease, color 180ms ease",
						"&:hover": {
							color: theme.palette.primary.main,
							borderColor: theme.palette.primary.main,
							cursor: "pointer",
						},
					})}
					onClick={() => setOpen(true)}
				>
					<AddIcon />
					<Typography variant="caption" sx={{ mt: 0.5 }}>
						Novo experimento
					</Typography>
				</Box>
			</Tooltip>
			<NewExperimentDialog open={open} onClose={() => setOpen(false)} />
		</>
	)
}
