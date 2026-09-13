import { useState } from "react"
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material"
import { toast } from "react-toastify"
import type { Experiment } from "../../../types"
import { useAuth } from "../../../providers/AuthContext"
import {
	copyExperiment,
	moveExperiment,
} from "../../../services/experimentService"

export type ContextDialogMode = "copy" | "move"

interface ExperimentContextDialogProps {
	open: boolean
	mode: ContextDialogMode
	experiment: Experiment
	onClose: () => void
	onDone: () => void
}

/**
 * FE-15: destino da cópia/movimentação de um experimento entre contextos
 * (pessoal ↔ laboratório). A cópia cria análise independente sobre o mesmo
 * blob; mover troca o contexto sem duplicar nada — permissões no backend.
 */
export default function ExperimentContextDialog({
	open,
	mode,
	experiment,
	onClose,
	onDone,
}: ExperimentContextDialogProps) {
	const { user } = useAuth()
	const [dest, setDest] = useState<string>("")
	const [title, setTitle] = useState<string>(`${experiment.title} copia`)
	const [saving, setSaving] = useState(false)

	const memberships = user?.memberships ?? []
	const isCopy = mode === "copy"

	const handleConfirm = async () => {
		const organizationId = dest === "" ? null : Number(dest)
		setSaving(true)
		try {
			if (isCopy) {
				await copyExperiment(experiment.id, {
					title: title.trim() || undefined,
					organization_id: organizationId,
				})
				toast.success("Cópia criada — a análise é independente da origem.")
			} else {
				await moveExperiment(experiment.id, organizationId)
				toast.success("Experimento movido.")
			}
			onDone()
			onClose()
		} catch (error: any) {
			toast.error(
				error?.response?.data?.detail ||
					"Não foi possível concluir a operação.",
			)
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>
				{isCopy ? "Copiar experimento para…" : "Mover experimento para…"}
			</DialogTitle>
			<DialogContent
				sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
			>
				<Typography variant="body2" color="text.secondary">
					{isCopy
						? "Cria uma análise independente (gates, subsamples) sobre os mesmos dados — sem re-upload."
						: "Mover muda quem pode ver e editar este experimento. Nada é duplicado."}
				</Typography>
				{isCopy && (
					<TextField
						label="Título da cópia"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						fullWidth
						size="small"
					/>
				)}
				<FormControl fullWidth size="small">
					<InputLabel id="dest-context-label">Destino</InputLabel>
					<Select
						labelId="dest-context-label"
						value={dest}
						label="Destino"
						onChange={(e) => setDest(e.target.value)}
					>
						<MenuItem value="">
							<em>Pessoal (sem lab)</em>
						</MenuItem>
						{memberships.map((m) => (
							<MenuItem
								key={m.organization.id}
								value={String(m.organization.id)}
							>
								{m.organization.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					variant="contained"
					onClick={handleConfirm}
					disabled={saving || (isCopy && !title.trim())}
				>
					{isCopy ? "Copiar" : "Mover"}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
