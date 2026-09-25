import { useEffect, useMemo, useState } from "react"
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	CircularProgress,
	FormControlLabel,
	Switch,
	TextField,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material"
import { AppDialog } from "../../../components/AppDialog"
import MatrixCellsGrid from "./MatrixCellsGrid"
import CompensationPreview from "./CompensationPreview"
import { useExperimentQuery } from "../../experiment/hooks/useExperimentData"
import { useExperimentWorkspace } from "../../experiment/context/ExperimentWorkspaceContext"
import { useCompensationPreview } from "../hooks/useCompensationPreview"
import { extractErrorMessage } from "../../../utils/apiError"
import type {
	CompensationManualCreatePayload,
	CompensationMatrix,
} from "../../../services/compensationService"
import { fluorescentChannels } from "../utils/controlAssignments"
import {
	changedCellKeys,
	formatPercentCell,
	identityMatrix,
	invalidCellKeys,
	parsePercentGrid,
} from "../utils/matrixEdit"

interface EditCompensationDialogProps {
	experimentId: number
	open: boolean
	onClose: () => void
	/** Ajuste de matriz existente (deriva); null = criação do zero. */
	source: CompensationMatrix | null
	/**
	 * Matriz somente-leitura (ex.: embutida no arquivo) — mostra a grade
	 * sem opção de editar/criar.
	 */
	viewOnly?: { name: string; channels: string[]; matrix: number[][] } | null
	/** Sem escrita: a matriz salva abre em leitura sem o botão "Editar". */
	canEdit?: boolean
	/** Devolve a mensagem de erro para exibir no dialog; null = sucesso. */
	onSubmit: (payload: CompensationManualCreatePayload) => Promise<string | null>
}

/**
 * FE-40 — editor de matriz. "Editar" nunca toca a original: salva uma
 * nova `manual` com `derived_from`. "Nova" parte da identidade sobre os
 * canais escolhidos. Células editam em %, mesmo formato da grade
 * read-only; inválida marca o campo e bloqueia o confirmar.
 */
export default function EditCompensationDialog({
	experimentId,
	open,
	onClose,
	source,
	viewOnly,
	canEdit = true,
	onSubmit,
}: EditCompensationDialogProps) {
	const experiment = useExperimentQuery(String(experimentId))
	const availableChannels = useMemo(
		() => fluorescentChannels(experiment.data?.values ?? []),
		[experiment.data?.values],
	)

	// FE-41: a amostra do preview é a mesma do plot principal.
	const { source: workspaceSource, experimentFiles } = useExperimentWorkspace()
	const previewFile = experimentFiles.find(
		(f) => f.id === workspaceSource?.fileDataId,
	)
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down("md"))

	const [step, setStep] = useState<"channels" | "grid">("grid")
	const [channels, setChannels] = useState<string[]>([])
	const [cells, setCells] = useState<string[][]>([])
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	// Ajuste abre em modo leitura (a matriz bonita); "Editar" liga as células.
	const [editing, setEditing] = useState(false)
	// FE-41: preview da matriz em edição — desktop liga, mobile desliga.
	const [previewOn, setPreviewOn] = useState(true)
	const [previewX, setPreviewX] = useState("")
	const [previewY, setPreviewY] = useState("")

	// Ao abrir: ajuste e viewOnly abrem na grade em leitura; modo novo
	// começa na escolha de canais (default: todos os fluorescentes).
	useEffect(() => {
		if (!open) return
		const view = source ?? viewOnly ?? null
		setError(null)
		setSaving(false)
		setEditing(!view)
		setPreviewOn(!isMobile)
		if (view) {
			setStep("grid")
			setChannels(view.channels)
			setCells(view.matrix.map((row) => row.map(formatPercentCell)))
			setName(source ? `${source.name} (ajustada)` : "")
			setPreviewX(view.channels[0] ?? "")
			setPreviewY(view.channels[1] ?? view.channels[0] ?? "")
		} else {
			setStep("channels")
			setChannels([])
			setCells([])
			setName("")
		}
	}, [open, source, viewOnly, isMobile])

	// Modo novo: canais chegam assíncronos — seleciona todos por default.
	useEffect(() => {
		if (open && !source && step === "channels" && !channels.length) {
			setChannels(availableChannels)
		}
	}, [open, source, step, channels.length, availableChannels])

	const parsed = useMemo(() => parsePercentGrid(cells), [cells])
	const invalid = useMemo(() => invalidCellKeys(cells), [cells])
	const changed = useMemo(
		() =>
			source
				? changedCellKeys(source.matrix, parsed as number[][])
				: new Set<string>(),
		[source, parsed],
	)

	// FE-41: preview da grade em edição — inválida não dispara request.
	const preview = useCompensationPreview({
		experimentId,
		channels,
		matrix: editing && invalid.size === 0 ? (parsed as number[][]) : null,
		fileId: workspaceSource?.fileDataId,
		xAxis: previewX,
		yAxis: previewY,
		enabled: previewOn && editing && step === "grid",
	})

	const openGrid = () => {
		setCells(
			identityMatrix(channels.length).map((row) => row.map(formatPercentCell)),
		)
		setPreviewX(channels[0] ?? "")
		setPreviewY(channels[1] ?? channels[0] ?? "")
		setStep("grid")
	}

	const submit = async (apply: boolean) => {
		if (saving || invalid.size) return
		setSaving(true)
		const payload: CompensationManualCreatePayload = {
			channels,
			matrix: parsed as number[][],
			...(name.trim() ? { name: name.trim() } : {}),
			...(source ? { derived_from: source.id } : {}),
			...(apply ? { apply: true } : {}),
		}
		const submitError = await onSubmit(payload)
		setSaving(false)
		if (submitError) {
			setError(submitError)
			return
		}
		onClose()
	}

	const setCell = (i: number, j: number, raw: string) => {
		setError(null)
		setCells((prev) =>
			prev.map((row, ri) =>
				ri === i ? row.map((v, rj) => (rj === j ? raw : v)) : row,
			),
		)
	}

	const channelStep = (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
			<Typography variant="caption" color="text.secondary">
				Escolha os canais fluorescentes da matriz — a grade abre como identidade
				(100% na diagonal) pra você preencher.
			</Typography>
			<Autocomplete
				multiple
				size="small"
				options={availableChannels}
				value={channels}
				onChange={(_, selected) => setChannels(selected)}
				renderInput={(params) => (
					<TextField {...params} label="Canais da matriz" />
				)}
			/>
		</Box>
	)

	const gridStep = (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 0.5 }}>
			{source?.is_applied && (
				<Alert severity="warning" variant="outlined">
					<strong>{source.name}</strong> está aplicada — a ajustada não se
					aplica sozinha. "Criar e aplicar" troca a compensação ativa (muda
					gates e estatísticas e fica registrado no histórico).
				</Alert>
			)}
			{editing && (
				<TextField
					size="small"
					label="Nome da matriz"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			)}
			<MatrixCellsGrid
				channels={channels}
				cells={cells}
				editable={editing}
				invalid={invalid}
				changed={changed}
				onCellChange={setCell}
				footerHint={
					source && editing
						? " Células destacadas divergem da original."
						: undefined
				}
			/>
			{editing && (
				<FormControlLabel
					control={
						<Switch
							size="small"
							checked={previewOn}
							onChange={(_, checked) => setPreviewOn(checked)}
						/>
					}
					label={
						<Typography variant="caption" color="text.secondary">
							pré-visualizar efeito na amostra atual — nada é salvo
						</Typography>
					}
				/>
			)}
			{editing && previewOn && (
				<CompensationPreview
					channels={channels}
					xAxis={previewX}
					yAxis={previewY}
					onAxisChange={(axis, channel) =>
						axis === "x" ? setPreviewX(channel) : setPreviewY(channel)
					}
					data={preview.data}
					loading={preview.isLoading}
					fetching={preview.isFetching}
					error={preview.error ? extractErrorMessage(preview.error) : null}
					fileName={previewFile?.file_name}
				/>
			)}
		</Box>
	)

	const loading = !source && !viewOnly && experiment.isLoading

	return (
		<AppDialog
			open={open}
			title={
				viewOnly
					? viewOnly.name
					: source
						? `Ajustar "${source.name}"`
						: "Nova matriz de compensação"
			}
			onClose={onClose}
			maxWidth="sm"
			actions={
				step === "channels" ? (
					<>
						<Button onClick={onClose}>Cancelar</Button>
						<Button
							variant="contained"
							onClick={openGrid}
							disabled={!channels.length}
						>
							Continuar
						</Button>
					</>
				) : !editing ? (
					<>
						<Button onClick={onClose}>Fechar</Button>
						{source && canEdit && (
							<Button variant="contained" onClick={() => setEditing(true)}>
								Editar
							</Button>
						)}
					</>
				) : (
					<>
						{!source && (
							<Button onClick={() => setStep("channels")} disabled={saving}>
								Voltar
							</Button>
						)}
						{source && <Button onClick={onClose}>Cancelar</Button>}
						{source?.is_applied ? (
							<>
								<Button
									variant="outlined"
									onClick={() => void submit(false)}
									disabled={saving || invalid.size > 0}
								>
									Criar
								</Button>
								<Button
									variant="contained"
									onClick={() => void submit(true)}
									disabled={saving || invalid.size > 0}
								>
									Criar e aplicar
								</Button>
							</>
						) : (
							<Button
								variant="contained"
								onClick={() => void submit(false)}
								disabled={saving || invalid.size > 0}
							>
								{source ? "Criar ajuste" : "Criar matriz"}
							</Button>
						)}
					</>
				)
			}
		>
			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
					<CircularProgress size={24} />
				</Box>
			) : step === "channels" ? (
				channelStep
			) : (
				gridStep
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
