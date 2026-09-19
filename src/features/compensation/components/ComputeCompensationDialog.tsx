import { useEffect, useMemo, useState } from "react"
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	TextField,
	Typography,
} from "@mui/material"
import { AppDialog } from "../../../components/AppDialog"
import {
	useExperimentFilesQuery,
	useExperimentQuery,
	useSubsamplesQuery,
} from "../../experiment/hooks/useExperimentData"
import type { CompensationComputePayload } from "../../../services/compensationService"
import type { ExperimentFiles } from "../../../types"
import {
	assignedFileIds,
	fileMatchesChannel,
	fileMatchesNegative,
	fluorescentChannels,
	sortFilesForRow,
	suggestControlAssignments,
	uncoveredChannels,
	validateControlAssignment,
} from "../utils/controlAssignments"
import type { ControlAssignment } from "../utils/controlAssignments"

const EMPTY_ASSIGNMENT: ControlAssignment = { negative: [], controls: {} }

interface ComputeCompensationDialogProps {
	experimentId: number
	open: boolean
	onClose: () => void
	/** Devolve a mensagem de erro para exibir no dialog; null = sucesso. */
	onSubmit: (payload: CompensationComputePayload) => Promise<string | null>
}

/**
 * FE-39 — cálculo de compensação por escolha direta de amostras.
 * Uma linha por canal fluorescente + a linha do negativo; prefill dos
 * subsamples-controle e sugestão por nome de arquivo. Revisão com
 * sumário antes de enviar; canal sem controle vira aviso (matriz
 * parcial é válida), nunca bloqueio.
 */
export default function ComputeCompensationDialog({
	experimentId,
	open,
	onClose,
	onSubmit,
}: ComputeCompensationDialogProps) {
	const id = String(experimentId)
	const experiment = useExperimentQuery(id)
	const filesQuery = useExperimentFilesQuery(id)
	const subsamplesQuery = useSubsamplesQuery(id)

	const channels = useMemo(
		() => fluorescentChannels(experiment.data?.values ?? []),
		[experiment.data?.values],
	)
	const files = useMemo(
		() => (filesQuery.data ?? []).filter((f) => f.active),
		[filesQuery.data],
	)
	const subsamples = subsamplesQuery.data ?? []

	const [step, setStep] = useState<"edit" | "review">("edit")
	const [name, setName] = useState("")
	const [assignment, setAssignment] =
		useState<ControlAssignment>(EMPTY_ASSIGNMENT)
	const [dirty, setDirty] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	// Ao abrir: estado limpo; o prefill acontece quando os dados chegarem.
	useEffect(() => {
		if (open) {
			setStep("edit")
			setName("")
			setError(null)
			setDirty(false)
			setAssignment(EMPTY_ASSIGNMENT)
		}
	}, [open])

	useEffect(() => {
		if (open && !dirty && files.length && experiment.data) {
			setAssignment(suggestControlAssignments(files, channels, subsamples))
		}
	}, [open, dirty, files, channels, subsamples, experiment.data])

	const byId = useMemo(() => new Map(files.map((f) => [f.id, f])), [files])
	const fileName = (fid: number) => byId.get(fid)?.file_name ?? `#${fid}`
	const toFiles = (ids: number[]): ExperimentFiles[] =>
		ids.map((fid) => byId.get(fid)).filter((f): f is ExperimentFiles => !!f)

	const setRow = (key: string, ids: number[]) => {
		setDirty(true)
		setError(null)
		setAssignment((prev) =>
			key === "negative"
				? { ...prev, negative: ids }
				: { ...prev, controls: { ...prev.controls, [key]: ids } },
		)
	}

	const uncovered = uncoveredChannels(assignment, channels)

	const handleReview = () => {
		const validationError = validateControlAssignment(assignment)
		if (validationError) {
			setError(validationError)
			return
		}
		setError(null)
		setStep("review")
	}

	const handleSubmit = async () => {
		if (saving) return
		setSaving(true)
		const payload: CompensationComputePayload = {
			negative: assignment.negative,
			controls: Object.fromEntries(
				Object.entries(assignment.controls).filter(([, ids]) => ids.length),
			),
			...(name.trim() ? { name: name.trim() } : {}),
		}
		const submitError = await onSubmit(payload)
		setSaving(false)
		if (submitError) {
			setError(submitError)
			return
		}
		onClose()
	}

	const renderRow = (
		key: string,
		label: string,
		values: number[],
		matches: (f: ExperimentFiles) => boolean,
	) => {
		const usedElsewhere = assignedFileIds(assignment, key)
		return (
			<Autocomplete
				key={key}
				multiple
				size="small"
				options={sortFilesForRow(files, matches)}
				value={toFiles(values)}
				getOptionLabel={(f) => f.file_name}
				isOptionEqualToValue={(a, b) => a.id === b.id}
				getOptionDisabled={(f) => usedElsewhere.has(f.id)}
				onChange={(_, selected) =>
					setRow(
						key,
						selected.map((f) => f.id),
					)
				}
				renderInput={(params) => <TextField {...params} label={label} />}
			/>
		)
	}

	const loading =
		experiment.isLoading || filesQuery.isLoading || subsamplesQuery.isLoading

	return (
		<AppDialog
			open={open}
			title={step === "edit" ? "Calcular compensação" : "Confirmar controles"}
			onClose={onClose}
			maxWidth="sm"
			actions={
				step === "edit" ? (
					<>
						<Button onClick={onClose}>Cancelar</Button>
						<Button variant="contained" onClick={handleReview}>
							Continuar
						</Button>
					</>
				) : (
					<>
						<Button onClick={() => setStep("edit")} disabled={saving}>
							Voltar
						</Button>
						<Button
							variant="contained"
							onClick={() => void handleSubmit()}
							disabled={saving}
						>
							{uncovered.length ? "Calcular mesmo assim" : "Calcular matriz"}
						</Button>
					</>
				)
			}
		>
			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
					<CircularProgress size={24} />
				</Box>
			) : step === "edit" ? (
				<Box
					sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}
				>
					<Typography variant="caption" color="text.secondary">
						Escolha quais amostras são os controles de cada canal — nomes que
						combinam com o canal aparecem primeiro na lista. Canal sem controle
						simplesmente não entra na matriz.
					</Typography>
					<TextField
						size="small"
						label="Nome da matriz (opcional)"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					{renderRow(
						"negative",
						"Controle negativo (unstained)",
						assignment.negative,
						fileMatchesNegative,
					)}
					{channels.map((channel) =>
						renderRow(
							channel,
							channel,
							assignment.controls[channel] ?? [],
							(f) => fileMatchesChannel(f, channel),
						),
					)}
				</Box>
			) : (
				<Box
					sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}
				>
					<Typography variant="body2">
						<strong>Controle negativo:</strong>{" "}
						{assignment.negative.map(fileName).join(", ")}
					</Typography>
					{channels
						.filter((c) => assignment.controls[c]?.length)
						.map((channel) => (
							<Typography key={channel} variant="body2">
								<strong>{channel}:</strong>{" "}
								{assignment.controls[channel].map(fileName).join(", ")}
							</Typography>
						))}
					{uncovered.length > 0 && (
						<Alert severity="warning" variant="outlined">
							Sem controle para: {uncovered.join(", ")}. A matriz vai cobrir
							apenas os canais selecionados — confirme que o experimento não usa
							esses canais.
						</Alert>
					)}
					<Typography variant="caption" color="text.secondary">
						O cálculo usa a mediana dos eventos de cada controle e a matriz fica
						salva na lista — você aplica depois, se quiser.
					</Typography>
				</Box>
			)}
			{error && (
				<Typography
					variant="caption"
					color="error"
					sx={{ mt: 1, display: "block" }}
				>
					{error}
				</Typography>
			)}
		</AppDialog>
	)
}
