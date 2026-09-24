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
import { useExperimentQuery } from "../../experiment/hooks/useExperimentData"
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
	onSubmit,
}: EditCompensationDialogProps) {
	const experiment = useExperimentQuery(String(experimentId))
	const availableChannels = useMemo(
		() => fluorescentChannels(experiment.data?.values ?? []),
		[experiment.data?.values],
	)

	const [step, setStep] = useState<"channels" | "grid">("grid")
	const [channels, setChannels] = useState<string[]>([])
	const [cells, setCells] = useState<string[][]>([])
	const [name, setName] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	// Ao abrir: modo edição vai direto pra grade preenchida; modo novo
	// começa na escolha de canais (default: todos os fluorescentes).
	useEffect(() => {
		if (!open) return
		setError(null)
		setSaving(false)
		if (source) {
			setStep("grid")
			setChannels(source.channels)
			setCells(source.matrix.map((row) => row.map(formatPercentCell)))
			setName(`${source.name} (ajustada)`)
		} else {
			setStep("channels")
			setChannels([])
			setCells([])
			setName("")
		}
	}, [open, source])

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

	const openGrid = () => {
		setCells(
			identityMatrix(channels.length).map((row) => row.map(formatPercentCell)),
		)
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
			<TextField
				size="small"
				label="Nome da matriz"
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>
			<Box
				sx={(theme) => ({
					overflowX: "auto",
					fontSize: "0.65rem",
					fontFamily: "monospace",
					border: 1,
					borderColor: "divider",
					borderRadius: 1,
					p: 0.5,
					bgcolor: theme.palette.action.hover,
				})}
			>
				<table style={{ borderCollapse: "collapse" }}>
					<thead>
						<tr>
							<th />
							{channels.map((c) => (
								<th
									key={c}
									style={{
										padding: "1px 4px",
										writingMode: "vertical-rl",
										fontWeight: 600,
										textAlign: "left",
									}}
								>
									{c}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{cells.map((row, i) => (
							<tr key={channels[i] ?? i}>
								<td style={{ fontWeight: 600, paddingRight: 4 }}>
									{channels[i]}
								</td>
								{row.map((raw, j) => (
									<td key={j} style={{ padding: 1 }}>
										<Box
											component="input"
											value={raw}
											inputMode="decimal"
											aria-label={`${channels[i]} ← ${channels[j]}`}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												setCell(i, j, e.target.value)
											}
											sx={{
												width: "3.4rem",
												font: "inherit",
												textAlign: "right",
												p: "2px 4px",
												border: 1,
												borderRadius: 0.5,
												borderColor: invalid.has(`${i},${j}`)
													? "error.main"
													: "divider",
												bgcolor: invalid.has(`${i},${j}`)
													? "error.light"
													: changed.has(`${i},${j}`)
														? "warning.light"
														: "background.paper",
												fontWeight: i === j ? 700 : 400,
												color: "text.primary",
												outline: "none",
												"&:focus": {
													borderColor: "primary.main",
												},
											}}
										/>
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
				<Typography variant="caption" color="text.secondary">
					Valores em % — linha = canal detector, coluna = fluorócromo.
					{source && " Células destacadas divergem da original."}
				</Typography>
			</Box>
		</Box>
	)

	const loading = !source && experiment.isLoading

	return (
		<AppDialog
			open={open}
			title={source ? `Ajustar "${source.name}"` : "Nova matriz de compensação"}
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
