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
import type {
	ExperimentFiles,
	Subsample,
	SuggestIntent,
	SuggestionGateType,
	SuggestRequestPayload,
} from "../../../types"
import type { GateTool } from "../../plot/hooks/usePlotState"
import {
	controlKindForChannel,
	gateTypeForTool,
	intentByValue,
	isFluorescenceChannel,
	SUGGEST_INTENTS,
	V1_INTENTS,
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
	files,
	subsamples,
	currentFile,
	submitting,
	error,
	onSubmit,
}: SuggestDialogProps) {
	const [intent, setIntent] = useState<SuggestIntent>("separate")
	const [gateType, setGateType] = useState<SuggestionGateType>(
		gateTypeForTool(tool),
	)
	const [controlX, setControlX] = useState<number | null>(null)
	const [controlY, setControlY] = useState<number | null>(null)

	// Reabrir com a ferramenta atual — o tipo de saída acompanha o select
	// Gate da toolbar, revisável aqui.
	useEffect(() => {
		if (open) setGateType(gateTypeForTool(tool))
	}, [open, tool])

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
			channels: [xAxis, yAxis],
			intent,
			gate_type: gateType,
			control_files,
		})
	}

	return (
		<AppDialog
			open={open}
			onClose={onClose}
			title="Sugerir populações"
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
					<Chip size="small" variant="outlined" label={`${xAxis} × ${yAxis}`} />
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
							setGateType(intentByValue(next).preferredGateType)
						}}
					>
						{SUGGEST_INTENTS.map((i) => {
							const v1 = V1_INTENTS.has(i.value)
							return (
								<MenuItem key={i.value} value={i.value} disabled={!v1}>
									<Box>
										<Typography variant="body2">
											{i.label}
											{!v1 ? " (em breve)" : ""}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{i.description}
										</Typography>
									</Box>
								</MenuItem>
							)
						})}
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
						onChange={(e) => setGateType(e.target.value as SuggestionGateType)}
					>
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
