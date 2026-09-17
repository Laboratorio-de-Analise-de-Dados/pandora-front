import { useState } from "react"
import { MdAdd as AddIcon } from "react-icons/md"
import { Box, Typography } from "@mui/material"
import NewExperimentDialog from "../../../features/experiment/components/NewExperimentDialog"

export default function NewExperimentCard() {
	const [open, setOpen] = useState(false)

	return (
		<>
			<Box
				component="li"
				sx={(theme) => ({
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					gap: 0.5,
					flex: "1 1 15rem",
					maxWidth: "24rem",
					minHeight: "8rem",
					border: `1.5px dashed ${theme.palette.divider}`,
					color: theme.palette.text.secondary,
					padding: "1rem",
					borderRadius: "16px",
					transition:
						"border-color 180ms ease, color 180ms ease, background-color 180ms ease",
					"&:hover": {
						color: theme.palette.primary.main,
						borderColor: theme.palette.primary.main,
						backgroundColor: "rgba(16, 185, 129, 0.06)",
						cursor: "pointer",
					},
				})}
				onClick={() => setOpen(true)}
			>
				<AddIcon size={28} />
				<Typography variant="body2" fontWeight={600}>
					Criar novo experimento
				</Typography>
				<Typography variant="caption" color="text.secondary">
					Upload de arquivos .fcs ou .zip
				</Typography>
			</Box>
			<NewExperimentDialog open={open} onClose={() => setOpen(false)} />
		</>
	)
}
