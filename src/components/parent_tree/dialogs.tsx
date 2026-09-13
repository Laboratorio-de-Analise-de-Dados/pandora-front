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
import { useEffect, useState } from "react"
import type { ExperimentFiles, Subsample } from "../../types"

/**
 * Cria ou renomeia um subsample. Com `target` é rename (mostra o `source_path`
 * como contexto read-only — é imutável, o rótulo editável é o nome). Erro da
 * API (ex.: nome duplicado) aparece no campo.
 */
export function SubsampleFormDialog({
	open,
	target,
	onSubmit,
	onClose,
}: {
	open: boolean
	/** null = criar; Subsample = renomear */
	target: Subsample | null
	onSubmit: (name: string) => Promise<string | null>
	onClose: () => void
}) {
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const editing = target !== null

	useEffect(() => {
		if (open) {
			setName(target?.name ?? "")
			setError(null)
		}
	}, [open, target])

	const handleSubmit = async () => {
		if (!name.trim() || saving) return
		setSaving(true)
		const submitError = await onSubmit(name.trim())
		setSaving(false)
		if (submitError) {
			setError(submitError)
			return
		}
		onClose()
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>
				{editing ? "Renomear subsample" : "Novo subsample"}
			</DialogTitle>
			<DialogContent>
				{editing && target?.source_path && (
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", display: "block", mb: 1 }}
					>
						Veio de <code>{target.source_path}</code> no ZIP
					</Typography>
				)}
				<TextField
					autoFocus
					label="Nome do subsample"
					value={name}
					onChange={(e) => setName(e.target.value)}
					error={!!error}
					helperText={error}
					fullWidth
					sx={{ mt: editing ? 0 : 1 }}
					onKeyDown={(e) => {
						if (e.key === "Enter") void handleSubmit()
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					onClick={() => void handleSubmit()}
					variant="contained"
					disabled={!name.trim() || saving}
				>
					Salvar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

/**
 * Confirma o arquivamento: inativa o subsample e desvincula as amostras —
 * nada é apagado (BE-07, ADR-0005).
 */
export function ArchiveSubsampleDialog({
	target,
	onConfirm,
	onClose,
}: {
	target: Subsample | null
	onConfirm: (subsampleId: number) => void
	onClose: () => void
}) {
	return (
		<Dialog
			open={!!target}
			onClose={onClose}
			fullWidth
			maxWidth="xs"
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Arquivar subsample</DialogTitle>
			<DialogContent>
				<Typography>
					O subsample <strong>{target?.name}</strong> sai da listagem, mas nada
					é apagado: as {target?.files_count ?? 0} amostras ficam preservadas em
					"Sem subsample" e você pode reativá-lo depois pelo filtro "Mostrar
					desabilitadas".
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					onClick={() => target && onConfirm(target.id)}
					variant="contained"
				>
					Arquivar
				</Button>
			</DialogActions>
		</Dialog>
	)
}

/** Move a amostra para outro subsample — ou para "Sem subsample" (null). */
export function MoveFileDialog({
	file,
	subsamples,
	onConfirm,
	onClose,
}: {
	file: ExperimentFiles | null
	subsamples: Subsample[]
	onConfirm: (fileDataId: number, subsampleId: number | null) => void
	onClose: () => void
}) {
	const [selected, setSelected] = useState<string>("")

	useEffect(() => {
		if (file) setSelected(file.subsample != null ? String(file.subsample) : "")
	}, [file])

	const active = subsamples.filter((s) => s.active)

	return (
		<Dialog open={!!file} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>Mover amostra</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 1.5 }}>
					Mover <strong>{file?.file_name}</strong> para:
				</Typography>
				<FormControl fullWidth size="small">
					<InputLabel>Subsample</InputLabel>
					<Select
						value={selected}
						label="Subsample"
						onChange={(e) => setSelected(e.target.value)}
					>
						<MenuItem value="">
							<em>Sem subsample</em>
						</MenuItem>
						{active.map((s) => (
							<MenuItem key={s.id} value={String(s.id)}>
								{s.name} ({s.files_count}{" "}
								{s.files_count === 1 ? "amostra" : "amostras"})
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancelar</Button>
				<Button
					onClick={() =>
						file &&
						onConfirm(file.id, selected === "" ? null : Number(selected))
					}
					variant="contained"
				>
					Mover
				</Button>
			</DialogActions>
		</Dialog>
	)
}
