import { useState } from "react"
import {
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
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
		<Box
			component="form"
			onSubmit={handleSubmit}
			sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 500 }}
		>
			<TextField
				label="Nome da organização"
				value={name}
				onChange={(e) => setName(e.target.value)}
				required
			/>
			<FormControl>
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
			<Button type="submit" variant="contained" sx={{ mt: 1 }}>
				Criar organização
			</Button>
		</Box>
	)
}
