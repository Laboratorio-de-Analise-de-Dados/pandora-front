import { useMemo, useState } from "react"
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	FormControl,
	FormControlLabel,
	FormGroup,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import { MdOutlineInfo } from "react-icons/md"
import { toast } from "react-toastify"
import type { ExperimentFiles, Subsample } from "../../../types"
import type {
	AnalysisFigure,
	FigureChartType,
	FigureMetric,
	FigureSpec,
	FigureStatsTest,
} from "../../../services/figureService"
import type { FigureMockDeps } from "../../../services/figureMock"
import { useFigureMutations } from "../hooks/useFigures"
import { availablePopulationPaths } from "../utils/figureGroups"
import {
	channelLabel,
	FIGURE_METRICS,
	metricNeedsChannel,
	normalizeChannelKey,
	populationLabel,
	ROOT_POPULATION,
	statsTestLabel,
} from "../utils/figureSeries"
import GroupBuilder from "./GroupBuilder"
import StatsChart from "./StatsChart"
import DistributionChart from "./DistributionChart"
import FigureExportButton from "./FigureExportButton"
import { CHART_TYPE_LABELS } from "./FigureGallery"
import { extractErrorMessage } from "../../../utils/apiError"

interface FigureEditorProps {
	experimentId: number
	/** Figura aberta; `null` = rascunho novo. */
	figure: AnalysisFigure | null
	files: ExperimentFiles[]
	subsamples: Subsample[]
	channels: string[]
	canEdit: boolean
	mockDeps: FigureMockDeps
	onSaved: (figure: AnalysisFigure) => void
	onCancelNew: () => void
}

const emptySpec: FigureSpec = {
	groups: [],
	populations: [],
	metric: "median_mfi",
	channel: undefined,
	stats_test: "auto",
}

const STATS_TEST_OPTIONS: {
	value: FigureStatsTest
	label: string
	/** Explicação didática da metodologia — tooltip no item do select. */
	description: string
}[] = [
	{
		value: "auto",
		label: "Automático",
		description:
			"O backend escolhe: paramétrico quando todos os grupos têm n≥10, senão não-paramétrico. Recomendado na dúvida.",
	},
	{
		value: "parametric",
		label: "Paramétrico",
		description:
			"ANOVA (omnibus) + t de Welch por par. Assume distribuição ~normal e variâncias comparáveis — mais poderoso com n maior.",
	},
	{
		value: "nonparametric",
		label: "Não-paramétrico",
		description:
			"Kruskal-Wallis (omnibus) + Mann-Whitney por par. Não assume normalidade — seguro com poucas réplicas ou dados assimétricos.",
	},
	{
		value: "t_student",
		label: "t de Student",
		description:
			"Compara médias por par. Assume normalidade e variâncias iguais entre grupos — clássico pra 2 grupos.",
	},
	{
		value: "t_welch",
		label: "t de Welch",
		description:
			"Compara médias por par. Assume ~normalidade mas tolera variâncias diferentes — mais seguro que o t de Student.",
	},
	{
		value: "anova",
		label: "ANOVA",
		description:
			"Omnibus: há alguma diferença entre os 3+ grupos? + t de Welch por par. Assume normalidade e homocedasticidade.",
	},
	{
		value: "kruskal_wallis",
		label: "Kruskal-Wallis",
		description:
			"Versão não-paramétrica da ANOVA (ranks): omnibus 3+ grupos + Mann-Whitney por par. Sem pressupostos.",
	},
	{
		value: "mann_whitney",
		label: "Mann-Whitney U",
		description:
			"Compara ranks por par, sem pressupostos de distribuição. Ideal pra n pequeno — típico em citometria.",
	},
]

const STATS_TEST_HELP =
	"Qual teste compara os grupos da figura. Paramétricos assumem ~normalidade e são mais poderosos; não-paramétricos (ranks) são mais seguros com poucas réplicas. Passe o mouse sobre cada opção para ver pressupostos e quando usar."

/** Editor/viewer de figura — spec à esquerda (mobile: acima), gráfico ao lado. */
const FigureEditor = ({
	experimentId,
	figure,
	files,
	subsamples,
	channels,
	canEdit,
	mockDeps,
	onSaved,
	onCancelNew,
}: FigureEditorProps) => {
	const isNew = figure === null
	const locked = !!figure?.published || !canEdit

	const [name, setName] = useState(figure?.name ?? "")
	const [chartType, setChartType] = useState<FigureChartType>(
		figure?.chart_type ?? "stats_bar",
	)
	// `spec.channel` carrega a chave normalizada (como o back persiste em
	// `channel_statistics`) — figuras salvas antes com nome de exibição são
	// normalizadas na carga (idempotente).
	const [spec, setSpec] = useState<FigureSpec>(() =>
		figure?.spec
			? {
					...figure.spec,
					channel: figure.spec.channel
						? normalizeChannelKey(figure.spec.channel)
						: undefined,
				}
			: emptySpec,
	)
	const [dirty, setDirty] = useState(false)
	const [removedInfo, setRemovedInfo] = useState<string[]>([])
	const [graphDiv, setGraphDiv] = useState<HTMLElement | null>(null)
	// Toggles de visualização da figura (PRD §3) — locais, não vão pro spec.
	const [showMean, setShowMean] = useState(false)
	const [showSd, setShowSd] = useState(false)
	const [showSignificance, setShowSignificance] = useState(false)
	const [includeNs, setIncludeNs] = useState(false)

	const { create, update, recompute } = useFigureMutations(
		experimentId,
		mockDeps,
	)

	const needsChannel =
		chartType === "distribution" || metricNeedsChannel(spec.metric)
	const isStatsChart = chartType === "stats_bar" || chartType === "stats_strip"
	const populationOptions = useMemo(() => {
		const ids = spec.groups.flatMap((g) => g.file_data_ids)
		return [ROOT_POPULATION, ...availablePopulationPaths(files, ids)]
	}, [files, spec.groups])

	// file_data_ids é allow_empty=False no backend — grupo vazio → 400.
	const hasEmptyGroup = spec.groups.some((g) => g.file_data_ids.length === 0)
	const canSave =
		name.trim().length > 0 &&
		spec.groups.length > 0 &&
		!hasEmptyGroup &&
		spec.populations.length > 0 &&
		(!needsChannel || !!spec.channel)

	const handleSave = async () => {
		const payload = { name: name.trim(), chart_type: chartType, spec }
		try {
			if (isNew) {
				const created = await create.mutateAsync(payload)
				toast.success("Figura criada.")
				onSaved(created)
			} else {
				const saved = await update.mutateAsync({
					figureId: figure.id,
					payload: { ...payload, updated_at: figure.updated_at },
				})
				toast.success(
					saved.is_stale
						? "Figura salva — dados desatualizados, use Recomputar."
						: "Figura salva.",
				)
				setDirty(false)
				onSaved(saved)
			}
		} catch (e) {
			toast.error(extractErrorMessage(e))
		}
	}

	const handleRecompute = async () => {
		if (!figure) return
		try {
			const result = await recompute.mutateAsync(figure.id)
			const removed = [
				...result.removed_since_last.populations.map(
					(p) => `população ${populationLabel(p)}`,
				),
				...result.removed_since_last.files.map((f) => `amostra ${f.file_name}`),
			]
			setRemovedInfo(removed)
			toast.success(
				removed.length
					? `Recomputado — removidos: ${removed.join(", ")}`
					: "Figura recomputada.",
			)
			onSaved(result.figure)
		} catch (e) {
			toast.error(extractErrorMessage(e))
		}
	}

	const handlePublishToggle = async () => {
		if (!figure) return
		try {
			const saved = await update.mutateAsync({
				figureId: figure.id,
				payload: { published: !figure.published },
			})
			onSaved(saved)
		} catch (e) {
			toast.error(extractErrorMessage(e))
		}
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: { xs: "column", md: "row" },
				height: "100%",
				minHeight: 0,
			}}
		>
			{/* Coluna do spec */}
			<Box
				sx={{
					width: { xs: "100%", md: "38%" },
					minWidth: 0,
					overflowY: "auto",
					p: 2,
					borderRight: { md: 1 },
					borderBottom: { xs: 1, md: 0 },
					borderColor: "divider",
				}}
			>
				<Stack spacing={2}>
					<TextField
						size="small"
						label="Nome da figura"
						value={name}
						disabled={locked}
						inputProps={{ maxLength: 120 }}
						onChange={(e) => {
							setName(e.target.value)
							setDirty(true)
						}}
						fullWidth
					/>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
						<FormControl size="small" fullWidth>
							<InputLabel shrink>Tipo</InputLabel>
							<Select
								label="Tipo"
								value={chartType}
								disabled={locked}
								onChange={(e) => {
									const next = e.target.value as FigureChartType
									setChartType(next)
									// Distribution aceita população única no contrato.
									if (next === "distribution" && spec.populations.length > 1) {
										setSpec({
											...spec,
											populations: spec.populations.slice(0, 1),
										})
									}
									setDirty(true)
								}}
							>
								{(Object.keys(CHART_TYPE_LABELS) as FigureChartType[]).map(
									(t) => (
										<MenuItem key={t} value={t}>
											{CHART_TYPE_LABELS[t]}
										</MenuItem>
									),
								)}
							</Select>
						</FormControl>
						<FormControl
							size="small"
							fullWidth
							disabled={locked || chartType === "distribution"}
						>
							<InputLabel shrink>Métrica</InputLabel>
							<Select
								label="Métrica"
								value={spec.metric}
								onChange={(e) => {
									setSpec({ ...spec, metric: e.target.value as FigureMetric })
									setDirty(true)
								}}
							>
								{FIGURE_METRICS.map((m) => (
									<MenuItem key={m.value} value={m.value}>
										{m.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Stack>
					{needsChannel && (
						<FormControl size="small" fullWidth>
							<InputLabel shrink>Canal</InputLabel>
							<Select
								label="Canal"
								value={spec.channel ?? ""}
								disabled={locked}
								onChange={(e) => {
									setSpec({ ...spec, channel: e.target.value || undefined })
									setDirty(true)
								}}
							>
								{channels.map((c) => (
									<MenuItem key={c} value={normalizeChannelKey(c)}>
										{c}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					)}
					{isStatsChart && (
						<FormControl size="small" fullWidth>
							<InputLabel shrink>Teste estatístico</InputLabel>
							<Select
								label="Teste estatístico"
								value={spec.stats_test ?? "auto"}
								disabled={locked}
								renderValue={(v) =>
									STATS_TEST_OPTIONS.find((o) => o.value === v)?.label ?? v
								}
								onChange={(e) => {
									setSpec({
										...spec,
										stats_test: e.target.value as FigureStatsTest,
									})
									setDirty(true)
								}}
								endAdornment={
									<Tooltip title={STATS_TEST_HELP} placement="top" arrow>
										<Box
											component="span"
											sx={{
												display: "inline-flex",
												mr: 2.5,
												color: "text.secondary",
											}}
										>
											<MdOutlineInfo size={16} />
										</Box>
									</Tooltip>
								}
							>
								{STATS_TEST_OPTIONS.map((o) => (
									<Tooltip
										key={o.value}
										title={o.description}
										placement="right"
										arrow
									>
										<MenuItem value={o.value}>{o.label}</MenuItem>
									</Tooltip>
								))}
							</Select>
						</FormControl>
					)}
					{chartType === "distribution" ? (
						<Autocomplete
							size="small"
							options={populationOptions}
							getOptionLabel={populationLabel}
							value={spec.populations[0] ?? null}
							disabled={locked}
							onChange={(_e, value) => {
								setSpec({ ...spec, populations: value ? [value] : [] })
								setDirty(true)
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="População"
									placeholder="gate path ou Amostra inteira"
								/>
							)}
						/>
					) : (
						<Autocomplete
							multiple
							size="small"
							options={populationOptions}
							getOptionLabel={populationLabel}
							value={spec.populations}
							disabled={locked}
							onChange={(_e, value) => {
								setSpec({ ...spec, populations: value })
								setDirty(true)
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									label="Populações"
									placeholder="gate path ou Amostra inteira"
								/>
							)}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => (
									<Chip
										{...getTagProps({ index })}
										key={option}
										size="small"
										label={populationLabel(option)}
									/>
								))
							}
						/>
					)}
					<GroupBuilder
						groups={spec.groups}
						files={files}
						subsamples={subsamples}
						disabled={locked}
						onChange={(groups) => {
							setSpec({ ...spec, groups })
							setDirty(true)
						}}
					/>
					{canEdit && (
						<Stack direction="row" spacing={1}>
							<Button
								variant="contained"
								size="small"
								disabled={!canSave || (!isNew && !dirty)}
								onClick={handleSave}
							>
								{isNew ? "Criar figura" : "Salvar"}
							</Button>
							{isNew && (
								<Button size="small" onClick={onCancelNew}>
									Cancelar
								</Button>
							)}
						</Stack>
					)}
				</Stack>
			</Box>

			{/* Coluna do gráfico */}
			<Box
				sx={{
					flex: 1,
					minWidth: 0,
					display: "flex",
					flexDirection: "column",
					p: 2,
				}}
			>
				{isNew ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ m: "auto", textAlign: "center", maxWidth: 360 }}
					>
						Configure a figura e salve — o gráfico é calculado na criação.
					</Typography>
				) : (
					<>
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							flexWrap="wrap"
							sx={{ mb: 1 }}
						>
							{figure.is_stale && (
								<Chip label="desatualizada" size="small" color="warning" />
							)}
							{figure.published && (
								<Chip
									label="publicada"
									size="small"
									color="info"
									variant="outlined"
								/>
							)}
							<Typography variant="caption" color="text.secondary">
								rev {figure.result_revision ?? "—"}
								{figure.result_cache?.meta?.computed_at &&
									` · ${new Date(
										figure.result_cache.meta.computed_at,
									).toLocaleString()}`}
							</Typography>
							<Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
								{/* Recompute é sempre disponível (manual, idempotente) —
								    destaque âmbar quando o back marca stale. */}
								{canEdit && !figure.published && (
									<Button
										size="small"
										variant={figure.is_stale ? "contained" : "outlined"}
										color={figure.is_stale ? "warning" : "primary"}
										disabled={recompute.isPending}
										onClick={handleRecompute}
									>
										Recomputar
									</Button>
								)}
								{canEdit && (
									<Button
										size="small"
										variant="outlined"
										onClick={handlePublishToggle}
									>
										{figure.published ? "Despublicar" : "Publicar"}
									</Button>
								)}
								<FigureExportButton figure={figure} graphDiv={graphDiv} />
							</Box>
						</Stack>
						{removedInfo.length > 0 && (
							<Alert
								severity="info"
								onClose={() => setRemovedInfo([])}
								sx={{ mb: 1 }}
							>
								Removidos no recompute: {removedInfo.join(", ")}
							</Alert>
						)}
						{(figure.result_cache?.meta.warnings ?? []).map((w) => (
							<Alert severity="info" sx={{ mb: 1 }} key={w}>
								{w}
							</Alert>
						))}
						{[
							...new Set(
								(figure.result_cache?.stats_tests ?? []).flatMap(
									(t) => t.warnings,
								),
							),
						].map((w) => (
							<Alert severity="info" sx={{ mb: 1 }} key={w}>
								{w}
							</Alert>
						))}
						{Boolean(
							figure.result_cache?.unmatched.populations.length ||
							figure.result_cache?.unmatched.files.length,
						) && (
							<Alert severity="warning" sx={{ mb: 1 }}>
								Ausentes:{" "}
								{[
									...(figure.result_cache?.unmatched.populations ?? []).map(
										(p) => `população ${populationLabel(p)}`,
									),
									...(figure.result_cache?.unmatched.files ?? []).map(
										(f) => `amostra ${f.file_name ?? `#${f.file_data_id}`}`,
									),
								].join(", ")}
							</Alert>
						)}
						{figure.chart_type !== "distribution" && (
							<>
								{/* Metodologia efetiva do teste — sempre visível quando o
								    cache tem stats_tests (PRD §3: com "auto" o analista
								    precisa saber qual método rodou). */}
								<Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
									{(figure.result_cache?.stats_tests ?? []).map((t) => (
										<Chip
											key={t.population}
											size="small"
											variant="outlined"
											label={`${populationLabel(t.population)}: ${statsTestLabel(t)}`}
										/>
									))}
								</Stack>
								<FormGroup row>
									<FormControlLabel
										control={
											<Checkbox
												size="small"
												checked={showMean}
												onChange={(e) => setShowMean(e.target.checked)}
											/>
										}
										label={<Typography variant="caption">Média</Typography>}
									/>
									<FormControlLabel
										control={
											<Checkbox
												size="small"
												checked={showSd}
												onChange={(e) => setShowSd(e.target.checked)}
											/>
										}
										label={
											<Typography variant="caption">Desvio padrão</Typography>
										}
									/>
									<Tooltip
										title={
											figure.result_cache?.stats_tests?.length
												? "Brackets ns/*/**/*** entre grupos (p ajustado, BH)"
												: "Sem testes no cache — recompute a figura"
										}
									>
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={showSignificance}
													disabled={!figure.result_cache?.stats_tests?.length}
													onChange={(e) =>
														setShowSignificance(e.target.checked)
													}
												/>
											}
											label={
												<Typography variant="caption">Significância</Typography>
											}
										/>
									</Tooltip>
									{showSignificance && (
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={includeNs}
													onChange={(e) => setIncludeNs(e.target.checked)}
												/>
											}
											label={
												<Typography variant="caption">incluir ns</Typography>
											}
										/>
									)}
								</FormGroup>
								{showSignificance && (
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ mb: 0.5 }}
									>
										* p&lt;0,05 · ** p&lt;0,01 · *** p&lt;0,001 · ns = sem
										diferença significativa
									</Typography>
								)}
							</>
						)}
						<Box sx={{ flex: 1, minHeight: 320 }}>
							{figure.chart_type === "distribution" ? (
								<DistributionChart
									figure={figure}
									files={files}
									channels={channels}
									onInit={setGraphDiv}
								/>
							) : (
								<StatsChart
									figure={figure}
									channels={channels}
									showMean={showMean}
									showSd={showSd}
									showSignificance={showSignificance}
									includeNs={includeNs}
									onInit={setGraphDiv}
								/>
							)}
						</Box>
					</>
				)}
			</Box>
		</Box>
	)
}

export default FigureEditor
