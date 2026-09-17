import { useState } from "react"
import {
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	TextField,
	Typography,
} from "@mui/material"

interface CreateOrgTabProps {
	onSubmit: (name: string, orgType: string) => Promise<void>
}

export default function CreateOrgTab({ onSubmit }: CreateOrgTabProps) {
	const [name, setName] = useState("")
	const [orgType, setOrgType] = useState("lab")

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		await onSubmit(name, orgType)
		setName("")
	}

	return (
		<Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
			<Typography variant="h6" fontWeight={600}>
				Nova organização
			</Typography>
			<Typography variant="body2" color="text.secondary" mb={3}>
				Crie um laboratório ou grupo para compartilhar experimentos com outros
				pesquisadores.
			</Typography>
			<Box
				component="form"
				onSubmit={handleSubmit}
				sx={{
					display: "grid",
					gridTemplateColumns: {
						xs: "1fr",
						sm: "minmax(240px, 1fr) minmax(160px, 220px) auto",
					},
					gap: 2,
					alignItems: "start",
				}}
			>
				<TextField
					label="Nome da organização"
					value={name}
					onChange={(e) => setName(e.target.value)}
					size="small"
					required
				/>
				<FormControl size="small">
					<InputLabel>Tipo</InputLabel>
					<Select
						value={orgType}
						onChange={(e) => setOrgType(e.target.value)}
						label="Tipo"
					>
						<MenuItem value="lab">Laboratório</MenuItem>
						<MenuItem value="customer">Cliente</MenuItem>
					</Select>
				</FormControl>
				<Button
					type="submit"
					variant="contained"
					sx={{ whiteSpace: "nowrap", height: 40 }}
				>
					Criar organização
				</Button>
			</Box>
		</Paper>
	)
}
