import {
	Alert,
	Box,
	Chip,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Tooltip,
	Typography,
} from "@mui/material"
import { useEffect, useState } from "react"
import { AppDialog } from "../../../components/AppDialog"
import JuviaCatIcon from "./JuviaCatIcon"
import type {
	ExperimentFiles,
	Subsample,
	SuggestIntent,
	SuggestionGateType,
	SuggestRequestPayload,
} from "../../../types"
import type { GateTool, PlotMode } from "../../plot/hooks/usePlotState"
import {
	controlKindForChannel,
	gateTypeForMode,
	intentByValue,
	isFluorescenceChannel,
	SUGGEST_INTENTS,
	V1_INTENTS,
	V1_INTENTS_1D,
	type ControlKind,
} from "../utils/intents"
import {
	isControlFile,
	orderControlCandidates,
} from "../utils/controlCandidates"

export interface SuggestDialogProps {
	open: boolean
	onClose: () => void
	/** Contexto inferido da tela — nunca perguntado de novo (FE-42 §2). */
	fileName: string
	parentName: string | null
	xAxis: string
	yAxis: string
	tool: GateTool
	/** Histograma → pedido 1D (interval no eixo X — FE-45/JV-06). */
	plotMode: PlotMode
	files: ExperimentFiles[]
	subsamples: Subsample[]
	/** A amostra em tela — para o aviso "isto já é um controle". */
	currentFile?: ExperimentFiles
	submitting: boolean
	error?: string | null
	onSubmit: (
		payload: Omit<SuggestRequestPayload, "file_id" | "parent_id">,
	) => void
}

/** Select de controle de um eixo — candidatos ordenados por relevância. */
function ControlSelect({
	axis,
	channel,
	kind,
	files,
	subsamples,
	value,
	onChange,
}: {
	axis: "X" | "Y"
	channel: string
	kind: ControlKind
	files: ExperimentFiles[]
	subsamples: Subsample[]
	value: number | null
	onChange: (id: number) => void
}) {
	const candidates = orderControlCandidates(files, subsamples, kind, channel)
	return (
		<FormControl size="small" fullWidth>
			<InputLabel id={`control-${axis}-label`}>
				{kind === "fluorescence"
					? `Controle do eixo ${axis} (${channel})`
					: `Controle de população`}
			</InputLabel>
			<Select
				labelId={`control-${axis}-label`}
				label={
					kind === "fluorescence"
						? `Controle do eixo ${axis} (${channel})`
						: `Controle de população`
				}
				value={value != null ? String(value) : ""}
				onChange={(e) => onChange(Number(e.target.value))}
			>
				{candidates.map((f) => (
					<MenuItem key={f.id} value={String(f.id)}>
						{f.file_name}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	)
}

/**
 * FE-42 §2 — popover/dialog de pedido: contexto inferido como chips
 * read-only + a única pergunta real (a intenção). Tipo de saída vem
 * pré-selecionado da ferramenta ativa; no modo controle, um select por
 * eixo fluorescente (FMO/isotípico) ou controle de população (FSC×SSC).
 */
export default function SuggestDialog({
	open,
	onClose,
	fileName,
	parentName,
	xAxis,
	yAxis,
	tool,
	plotMode,
	files,
	subsamples,
	currentFile,
	submitting,
	error,
	onSubmit,
}: SuggestDialogProps) {
	const is1D = plotMode === "histogram"
	const [intent, setIntent] = useState<SuggestIntent>("separate")
	const [gateType, setGateType] = useState<SuggestionGateType>(
		gateTypeForMode(plotMode, tool),
	)
	const [controlX, setControlX] = useState<number | null>(null)
	const [controlY, setControlY] = useState<number | null>(null)

	// Reabrir com a ferramenta atual — o tipo de saída acompanha o select
	// Gate da toolbar, revisável aqui (no histograma é sempre interval).
	useEffect(() => {
		if (open) {
			setGateType(gateTypeForMode(plotMode, tool))
			if (plotMode === "histogram") setIntent("separate")
		}
	}, [open, tool, plotMode])

	const option = intentByValue(intent)
	const xIsFluo = isFluorescenceChannel(xAxis)
	const yIsFluo = isFluorescenceChannel(yAxis)
	const needsXControl = option.needsControl && xIsFluo
	const needsYControl = option.needsControl && yIsFluo
	const needsPopulationControl = option.needsControl && !xIsFluo && !yIsFluo
	const controlsReady =
		!option.needsControl ||
		((needsPopulationControl || needsXControl ? controlX != null : true) &&
			(needsYControl ? controlY != null : true))

	const showControlWarning =
		option.needsControl && isControlFile(currentFile, subsamples)

	const submit = () => {
		const control_files =
			option.needsControl && (controlX != null || controlY != null)
				? {
						x: needsPopulationControl || needsXControl ? controlX : null,
						y: needsYControl ? controlY : null,
					}
				: undefined
		onSubmit({
			// 1D manda só o canal do eixo X — o Y do histograma é contagem
			// derivada, não um canal real (FE-45).
			channels: is1D ? [xAxis] : [xAxis, yAxis],
			intent,
			gate_type: gateType,
			control_files,
		})
	}

	return (
		<AppDialog
			open={open}
			onClose={onClose}
			title={
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<JuviaCatIcon size={24} />
					Sugerir populações
				</Box>
			}
			onConfirm={submit}
			confirmLabel="Sugerir"
			confirmDisabled={!controlsReady}
			loading={submitting}
			maxWidth="sm"
		>
			<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
				{/* Contexto inferido — o que você vê é o que é analisado. */}
				<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
					<Chip size="small" variant="outlined" label={fileName} />
					<Chip
						size="small"
						variant="outlined"
						label={parentName ?? "Todos os eventos"}
					/>
					<Chip
						size="small"
						variant="outlined"
						label={is1D ? xAxis : `${xAxis} × ${yAxis}`}
					/>
				</Box>

				<FormControl size="small" fullWidth>
					<InputLabel id="suggest-intent-label">O que procurar</InputLabel>
					<Select
						labelId="suggest-intent-label"
						label="O que procurar"
						value={intent}
						onChange={(e) => {
							const next = e.target.value as SuggestIntent
							setIntent(next)
							setGateType(
								is1D ? "interval" : intentByValue(next).preferredGateType,
							)
						}}
					>
						{/* Só intents que o worker atende de fato entram no
						    select — a que ainda não existe não aparece. */}
						{SUGGEST_INTENTS.filter((i) =>
							(is1D ? V1_INTENTS_1D : V1_INTENTS).has(i.value),
						).map((i) => (
							<MenuItem key={i.value} value={i.value}>
								<Box>
									<Typography variant="body2">{i.label}</Typography>
									<Typography variant="caption" color="text.secondary">
										{is1D && i.value === "separate"
											? "Encontra populações separadas neste canal"
											: i.description}
									</Typography>
								</Box>
							</MenuItem>
						))}
					</Select>
				</FormControl>

				<FormControl size="small" fullWidth>
					<InputLabel id="suggest-gate-type-label">
						Tipo de gate sugerido
					</InputLabel>
					<Select
						labelId="suggest-gate-type-label"
						label="Tipo de gate sugerido"
						value={gateType}
						disabled={is1D}
						onChange={(e) => setGateType(e.target.value as SuggestionGateType)}
					>
						{/* Intervalo é a única geometria 1D — o select fica visível
							mas travado no histograma (FE-45). */}
						{is1D && <MenuItem value="interval">Intervalo (1D)</MenuItem>}
						<MenuItem value="polygon">Poligonal</MenuItem>
						<MenuItem value="rectangle">Retangular</MenuItem>
						<MenuItem value="quadrant">Quadrante</MenuItem>
					</Select>
				</FormControl>

				{option.needsControl && (
					<Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
						<Typography variant="caption" color="text.secondary">
							{needsPopulationControl
								? "Escolha a amostra de referência de população (ex.: controle do experimento)"
								: "Cada canal fluorescente precisa do seu controle (FMO ou isotípico) — o corte de cada eixo sai do controle dele."}
						</Typography>
						{(needsPopulationControl || needsXControl) && (
							<ControlSelect
								axis="X"
								channel={xAxis}
								kind={controlKindForChannel(xAxis)}
								files={files}
								subsamples={subsamples}
								value={controlX}
								onChange={setControlX}
							/>
						)}
						{needsYControl && (
							<ControlSelect
								axis="Y"
								channel={yAxis}
								kind={controlKindForChannel(yAxis)}
								files={files}
								subsamples={subsamples}
								value={controlY}
								onChange={setControlY}
							/>
						)}
					</Box>
				)}

				{showControlWarning && (
					<Tooltip
						title="Definir quadrantes e limiares a partir da amostra controle costuma ser mais confiável do que na amostra de teste"
						arrow
					>
						<Alert severity="info" sx={{ py: 0 }}>
							Esta amostra está marcada como controle — quadrantes e limiares
							normalmente se definem nela.
						</Alert>
					</Tooltip>
				)}

				{error && <Alert severity="error">{error}</Alert>}
			</Box>
		</AppDialog>
	)
}
