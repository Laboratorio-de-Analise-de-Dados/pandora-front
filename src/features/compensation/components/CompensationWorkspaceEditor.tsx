import { useMemo, useState } from "react"
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	TextField,
	Typography,
} from "@mui/material"
import { toast } from "react-toastify"
import MatrixCellsGrid from "./MatrixCellsGrid"
import { useCompensationEdit } from "../context/CompensationEditContext"
import { useExperimentWorkspace } from "../../experiment/context/ExperimentWorkspaceContext"
import { useCompensationActions } from "../hooks/useCompensation"
import {
	createCompensation,
	type CompensationManualCreatePayload,
} from "../../../services/compensationService"
import { extractErrorMessage } from "../../../utils/apiError"
import { fluorescentChannels } from "../utils/controlAssignments"

interface CompensationWorkspaceEditorProps {
	experimentId: number
}

/**
 * FE-41 — editor de matriz na seção Compensação do painel direito.
 * Enquanto ele está na tela o plot central mostra a prévia da grade
 * (borda âmbar + faixa "não salva") e os gates ficam somente-leitura.
 * Nada persiste até "Criar" / "Criar e aplicar"; "Cancelar" descarta.
 */
export default function CompensationWorkspaceEditor({
	experimentId,
}: CompensationWorkspaceEditorProps) {
	const {
		editing,
		matrix,
		invalid,
		changed,
		setName,
		setChannels,
		setCell,
		cancelEditing,
	} = useCompensationEdit()
	const { values } = useExperimentWorkspace()
	const { invalidateAll } = useCompensationActions(experimentId)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const availableChannels = useMemo(() => fluorescentChannels(values), [values])

	if (!editing) return null

	const submit = async (apply: boolean) => {
		if (saving || invalid.size > 0 || !matrix) return
		setSaving(true)
		const payload: CompensationManualCreatePayload = {
			channels: editing.channels,
			matrix,
			...(editing.name.trim() ? { name: editing.name.trim() } : {}),
			...(editing.base ? { derived_from: editing.base.id } : {}),
			...(apply ? { apply: true } : {}),
		}
		try {
			const created = await createCompensation(experimentId, payload)
			toast.success(
				created.is_applied
					? `Matriz "${created.name}" criada e aplicada.`
					: `Matriz "${created.name}" criada.`,
			)
			invalidateAll()
			cancelEditing()
		} catch (err) {
			setError(extractErrorMessage(err))
			setSaving(false)
		}
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: 1.5,
				p: 2,
			}}
		>
			<Box>
				<Typography variant="subtitle2">
					{editing.base
						? `Ajustando "${editing.base.name}"`
						: "Nova matriz de compensação"}
				</Typography>
				<Typography variant="caption" color="warning.dark">
					Prévia ao vivo no gráfico — nada é salvo até você criar.
				</Typography>
			</Box>

			{editing.base?.is_applied && (
				<Alert severity="warning" variant="outlined">
					<strong>{editing.base.name}</strong> está aplicada — a ajustada não se
					aplica sozinha. "Criar e aplicar" troca a compensação ativa (muda
					gates e estatísticas e fica registrado no histórico).
				</Alert>
			)}

			{/* Criação do zero permite escolher os canais (identidade nova);
			    ajuste mantém os canais da matriz de origem. */}
			{!editing.base && (
				<Autocomplete
					multiple
					size="small"
					options={availableChannels}
					value={editing.channels}
					onChange={(_, selected) => setChannels(selected)}
					renderInput={(params) => (
						<TextField {...params} label="Canais da matriz" />
					)}
				/>
			)}

			<TextField
				size="small"
				label="Nome da matriz"
				value={editing.name}
				onChange={(e) => setName(e.target.value)}
			/>

			<MatrixCellsGrid
				channels={editing.channels}
				cells={editing.cells}
				editable
				invalid={invalid}
				changed={changed}
				onCellChange={(i, j, raw) => {
					setError(null)
					setCell(i, j, raw)
				}}
				footerHint={
					editing.base ? " Células destacadas divergem da original." : undefined
				}
			/>

			{error && (
				<Typography variant="caption" color="error">
					{error}
				</Typography>
			)}

			<Box
				sx={{
					display: "flex",
					gap: 1,
					justifyContent: "flex-end",
					flexWrap: "wrap",
				}}
			>
				<Button size="small" onClick={cancelEditing} disabled={saving}>
					Cancelar
				</Button>
				{editing.base?.is_applied ? (
					<>
						<Button
							size="small"
							variant="outlined"
							onClick={() => void submit(false)}
							disabled={saving || invalid.size > 0}
						>
							Criar
						</Button>
						<Button
							size="small"
							variant="contained"
							onClick={() => void submit(true)}
							disabled={saving || invalid.size > 0}
						>
							Criar e aplicar
						</Button>
					</>
				) : (
					<Button
						size="small"
						variant="contained"
						onClick={() => void submit(false)}
						disabled={saving || invalid.size > 0 || !editing.channels.length}
					>
						{editing.base ? "Criar ajuste" : "Criar matriz"}
					</Button>
				)}
			</Box>
		</Box>
	)
}
