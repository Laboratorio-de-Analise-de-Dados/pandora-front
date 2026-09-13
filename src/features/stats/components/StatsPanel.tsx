import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
	Box,
	Chip,
	Collapse,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdBarChart as StatsIcon,
	MdFileDownload as ExportIcon,
	MdEdit as EditIcon,
	MdExpandMore as ExpandMoreIcon,
	MdExpandLess as ExpandLessIcon,
	MdTune as TuneIcon,
} from "react-icons/md"
import { fetchFileStats } from "../../../services/experimentService"
import type { SelectedSource } from "../../../types"
import type { AnalysisResultData, ExperimentFiles, Gate } from "../../../types"
import {
	findGateInTree,
	collectAllGates,
	findFileForGate,
	getGateStrategy,
} from "../../gate/utils"
import { normalizeChannelName } from "../utils/channelHelpers"
import { isFluorescence } from "../utils/channelHelpers"
import { exportRows } from "../utils/exportHelpers"
import { buildSelectableItems } from "../utils/selectable"
import { buildAnalysisRows } from "../utils/statsRows"
import type { PopulationRow } from "../utils/statsRows"
import { fmtPct } from "../../../utils/format"
import SourceSelector from "./SourceSelector"
import type { SelectableItem } from "./SourceSelector"
import StatsSummaryCard from "./StatsSummaryCard"
import StatsTable from "./StatsTable"
import ChannelConfigPopover from "./ChannelConfigPopover"
import ComparisonPanel from "./ComparisonPanel"
import ExportDialog from "./ExportDialog"
import LabelEditDialog from "./LabelEditDialog"

// --- Types ---

type MetricColumn = "mean_mfi" | "median_mfi" | "std_dev" | "cv"

interface MetricDef {
	key: MetricColumn
	label: string
	shortLabel: string
	format: (v: number) => string
}

const METRIC_COLUMNS: MetricDef[] = [
	{
		key: "mean_mfi",
		label: "MFI (Mean)",
		shortLabel: "Mean",
		format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }),
	},
	{
		key: "median_mfi",
		label: "MFI (Median)",
		shortLabel: "Median",
		format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }),
	},
	{
		key: "std_dev",
		label: "Std Dev",
		shortLabel: "SD",
		format: (v) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }),
	},
	{
		key: "cv",
		label: "CV (%)",
		shortLabel: "CV",
		format: (v) => `${v.toFixed(1)}%`,
	},
]

const DEFAULT_VISIBLE_METRICS = new Set<MetricColumn>([
	"mean_mfi",
	"median_mfi",
])

const LS_KEY_CHANNELS = "pandora_stats_selectedChannels"
const LS_KEY_METRICS = "pandora_stats_visibleMetrics"
const LS_KEY_LABELS = "pandora_channel_labels"

// --- Component ---

interface StatsPanelProps {
	source?: SelectedSource | undefined
	files: ExperimentFiles[]
	values: string[]
	onClose?: () => void
	fileStats?: AnalysisResultData | null
}

export default function StatsPanel({
	source: externalSource,
	files,
	values,
	onClose,
	fileStats: externalFileStats,
}: StatsPanelProps) {
	// --- Internal source selection ---
	const [statsSource, setStatsSource] = useState<SelectableItem | null>(null)
	const [internalFileStats, setInternalFileStats] =
		useState<AnalysisResultData | null>(null)

	const selectableItems = useMemo(() => buildSelectableItems(files), [files])

	const source: SelectedSource | undefined = useMemo(() => {
		if (statsSource) {
			return {
				type: statsSource.type,
				id: statsSource.id,
				name: statsSource.name,
				fileDataId: statsSource.fileDataId,
			}
		}
		return externalSource
	}, [statsSource, externalSource])

	const fileStats = statsSource
		? internalFileStats
		: (externalFileStats ?? internalFileStats)

	useEffect(() => {
		if (source?.type === "file") {
			fetchFileStats(source.id)
				.then((data) => setInternalFileStats(data))
				.catch(() => setInternalFileStats(null))
		} else {
			setInternalFileStats(null)
		}
	}, [source?.type, source?.id])

	useEffect(() => {
		if (!statsSource && !externalSource && selectableItems.length > 0) {
			setStatsSource(selectableItems[0])
		}
	}, [statsSource, externalSource, selectableItems])

	// --- State ---
	const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricColumn>>(
		() => {
			try {
				const saved = localStorage.getItem(LS_KEY_METRICS)
				if (saved) return new Set(JSON.parse(saved) as MetricColumn[])
			} catch {
				/* ignore */
			}
			return new Set(DEFAULT_VISIBLE_METRICS)
		},
	)
	const [selectedChannels, setSelectedChannels] = useState<Set<string> | null>(
		null,
	)
	const [statsExpanded, setStatsExpanded] = useState(true)
	const [channelMenuAnchor, setChannelMenuAnchor] =
		useState<HTMLElement | null>(null)
	const [customLabels, setCustomLabels] = useState<Record<string, string>>(
		() => {
			try {
				const saved = localStorage.getItem(LS_KEY_LABELS)
				if (saved) return JSON.parse(saved) as Record<string, string>
			} catch {
				/* ignore */
			}
			return {}
		},
	)
	const [labelDialogOpen, setLabelDialogOpen] = useState(false)
	const [editingLabels, setEditingLabels] = useState<Record<string, string>>({})

	// Export dialog state
	const [exportDialog, setExportDialog] = useState<{
		open: boolean
		defaultName: string
		format: "csv" | "xlsx"
		handler: (fileName: string, format: "csv" | "xlsx") => void
	}>({ open: false, defaultName: "", format: "csv", handler: () => {} })
	const [exportFileName, setExportFileName] = useState("")

	// --- Derived data ---

	const currentGate = useMemo(() => {
		if (!source || source.type !== "gate") return undefined
		for (const f of files) {
			const g = findGateInTree(f.gates, source.id)
			if (g) return g
		}
		return undefined
	}, [source, files])

	const channelLabelMap = useMemo(() => {
		const map: Record<string, string> = {}
		for (const v of values) map[normalizeChannelName(v)] = v
		return map
	}, [values])

	const channelLabel = useCallback(
		(ch: string) => customLabels[ch] || channelLabelMap[ch] || ch,
		[channelLabelMap, customLabels],
	)

	useEffect(() => {
		localStorage.setItem(LS_KEY_LABELS, JSON.stringify(customLabels))
	}, [customLabels])

	const openLabelDialog = useCallback(() => {
		setEditingLabels({ ...customLabels })
		setLabelDialogOpen(true)
	}, [customLabels])

	const saveLabelDialog = useCallback(() => {
		const cleaned: Record<string, string> = {}
		for (const [key, val] of Object.entries(editingLabels)) {
			if (val.trim()) cleaned[key] = val.trim()
		}
		setCustomLabels(cleaned)
		setLabelDialogOpen(false)
	}, [editingLabels])

	const allChannels = useMemo(() => {
		const analysis = currentGate?.analysis_result?.analysis_result
		if (analysis?.channel_statistics)
			return Object.keys(analysis.channel_statistics)
		if (fileStats?.channel_statistics)
			return Object.keys(fileStats.channel_statistics)
		return values.map((v) => normalizeChannelName(v))
	}, [currentGate, fileStats, values])

	useEffect(() => {
		try {
			const saved = localStorage.getItem(LS_KEY_CHANNELS)
			if (saved) {
				setSelectedChannels(new Set(JSON.parse(saved) as string[]))
				return
			}
		} catch {
			/* ignore */
		}
		setSelectedChannels(new Set(allChannels))
	}, [])

	useEffect(() => {
		if (selectedChannels === null && allChannels.length > 0)
			setSelectedChannels(new Set(allChannels))
	}, [allChannels, selectedChannels])

	useEffect(() => {
		if (selectedChannels)
			localStorage.setItem(
				LS_KEY_CHANNELS,
				JSON.stringify([...selectedChannels]),
			)
	}, [selectedChannels])
	useEffect(() => {
		localStorage.setItem(LS_KEY_METRICS, JSON.stringify([...visibleMetrics]))
	}, [visibleMetrics])

	const toggleChannel = useCallback((ch: string) => {
		setSelectedChannels((prev) => {
			const next = new Set(prev)
			if (next.has(ch)) next.delete(ch)
			else next.add(ch)
			return next
		})
	}, [])

	const toggleMetric = useCallback((m: MetricColumn) => {
		setVisibleMetrics((prev) => {
			const next = new Set(prev)
			if (next.has(m)) next.delete(m)
			else next.add(m)
			return next
		})
	}, [])

	const selectAll = useCallback(
		() => setSelectedChannels(new Set(allChannels)),
		[allChannels],
	)
	const clearAll = useCallback(() => setSelectedChannels(new Set()), [])
	const selectFluorescence = useCallback(
		() => setSelectedChannels(new Set(allChannels.filter(isFluorescence))),
		[allChannels],
	)

	const displayChannels = useMemo(() => {
		const channels = selectedChannels ?? new Set(allChannels)
		return allChannels.filter((ch) => channels.has(ch))
	}, [allChannels, selectedChannels])

	const analysisData: AnalysisResultData | undefined = useMemo(() => {
		if (currentGate?.analysis_result?.analysis_result)
			return currentGate.analysis_result.analysis_result
		if (source?.type === "file" && fileStats) return fileStats
		return undefined
	}, [currentGate, source, fileStats])

	// --- Export logic ---

	const buildStatsRows = useCallback(
		(scope: "current" | "all") => {
			const metricCols = METRIC_COLUMNS.filter((m) => visibleMetrics.has(m.key))
			const populations: PopulationRow[] = []

			const gateToPopulation = (
				gate: Gate,
				file?: ExperimentFiles,
			): PopulationRow => ({
				fileName:
					file?.file_name ?? findFileForGate(files, gate.id)?.file_name ?? "",
				strategy: getGateStrategy(files, gate.id),
				name: gate.name,
				analysis: gate.analysis_result?.analysis_result,
			})

			if (scope === "all") {
				for (const f of files)
					for (const g of collectAllGates(f.gates))
						populations.push(gateToPopulation(g, f))
			} else if (currentGate) {
				populations.push(gateToPopulation(currentGate))
			} else if (source?.type === "file" && fileStats) {
				populations.push({
					fileName: source.name,
					strategy: "",
					name: source.name,
					analysis: fileStats,
				})
			}

			return buildAnalysisRows(
				populations,
				displayChannels,
				metricCols,
				channelLabel,
			)
		},
		[
			currentGate,
			files,
			displayChannels,
			visibleMetrics,
			source,
			fileStats,
			channelLabel,
		],
	)

	const handleExport = useCallback(
		(scope: "current" | "all", format: "csv" | "xlsx") => {
			const baseName = `stats_${scope === "all" ? "all_gates" : (currentGate?.name ?? source?.name ?? "file")}`
			const rows = buildStatsRows(scope)
			setExportFileName(baseName)
			setExportDialog({
				open: true,
				defaultName: baseName,
				format,
				handler: (fileName, fmt) => exportRows(rows, `${fileName}.${fmt}`, fmt),
			})
		},
		[currentGate, source, buildStatsRows],
	)

	const handleExportComparison = useCallback(
		(rows: string[][], defaultName: string, format: "csv" | "xlsx") => {
			setExportFileName(defaultName)
			setExportDialog({
				open: true,
				defaultName,
				format,
				handler: (fileName, fmt) => exportRows(rows, `${fileName}.${fmt}`, fmt),
			})
		},
		[],
	)

	// --- Render ---

	const currentPath = statsSource?.path ?? (source ? source.name : null)
	const activeMetrics = METRIC_COLUMNS.filter((m) => visibleMetrics.has(m.key))

	const headerSection = (
		<Box
			sx={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				mb: 0.5,
			}}
		>
			<Typography variant="subtitle2" fontWeight="bold">
				<StatsIcon
					style={{ fontSize: 18, verticalAlign: "middle", marginRight: 4 }}
				/>
				Estatísticas
			</Typography>
		</Box>
	)

	// Empty state
	if (!source) {
		return (
			<Box sx={{ p: 2 }}>
				{headerSection}
				<SourceSelector
					currentPath={currentPath}
					selectableItems={selectableItems}
					source={source}
					onSelect={setStatsSource}
				/>
				<Box sx={{ textAlign: "center", mt: 2 }}>
					<StatsIcon style={{ fontSize: 36, opacity: 0.3 }} />
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Selecione um gate ou arquivo acima para ver as estatísticas.
					</Typography>
				</Box>
			</Box>
		)
	}

	// File selected without stats
	if (source.type === "file" && !fileStats) {
		return (
			<Box sx={{ p: 2 }}>
				{headerSection}
				<SourceSelector
					currentPath={currentPath}
					selectableItems={selectableItems}
					source={source}
					onSelect={setStatsSource}
				/>
				<Box sx={{ p: 1.5, bgcolor: "action.hover", borderRadius: 1, mt: 0.5 }}>
					<Typography variant="body2" color="text.secondary">
						Canais disponíveis:
					</Typography>
					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
						{values.map((v) => (
							<Chip key={v} label={v} size="small" variant="outlined" />
						))}
					</Box>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{ mt: 1, display: "block" }}
					>
						Carregando estatísticas...
					</Typography>
				</Box>
			</Box>
		)
	}

	const summary = analysisData?.summary_metrics
	const channelStats = analysisData?.channel_statistics

	return (
		<Box
			sx={{
				p: 1.5,
				display: "flex",
				flexDirection: "column",
				height: "100%",
				overflow: "hidden",
			}}
		>
			{headerSection}

			<SourceSelector
				currentPath={currentPath}
				selectableItems={selectableItems}
				source={source}
				onSelect={setStatsSource}
			/>

			{/* Collapsable stats section */}
			<Box
				sx={{
					mt: 0.5,
					border: "1px solid",
					borderColor: "divider",
					borderRadius: 1,
					overflow: "hidden",
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 0.5,
						px: 1,
						py: 0.5,
						bgcolor: "action.hover",
						cursor: "pointer",
						"&:hover": { bgcolor: "action.selected" },
					}}
					onClick={() => setStatsExpanded((p) => !p)}
				>
					{statsExpanded ? (
						<ExpandLessIcon style={{ fontSize: 16 }} />
					) : (
						<ExpandMoreIcon style={{ fontSize: 16 }} />
					)}
					<StatsIcon style={{ fontSize: 14 }} />
					<Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>
						Detalhes {currentGate ? `— ${currentGate.name}` : ""}
					</Typography>
					<Box
						sx={{ display: "flex", gap: 0.25 }}
						onClick={(e) => e.stopPropagation()}
					>
						<Tooltip title="Exportar CSV">
							<IconButton
								size="small"
								onClick={() => handleExport("current", "csv")}
								sx={{ p: 0.25 }}
							>
								<ExportIcon style={{ fontSize: 14 }} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Exportar Excel (.xlsx)">
							<IconButton
								size="small"
								onClick={() => handleExport("current", "xlsx")}
								sx={{ p: 0.25 }}
							>
								<ExportIcon style={{ fontSize: 14, color: "#1976d2" }} />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>

				<Collapse in={statsExpanded}>
					<Box sx={{ p: 1 }}>
						{summary && <StatsSummaryCard summary={summary} />}

						{channelStats && (
							<>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 0.5,
										mb: 0.5,
									}}
								>
									<Tooltip title="Configurar parâmetros e colunas">
										<IconButton
											size="small"
											onClick={(e) => setChannelMenuAnchor(e.currentTarget)}
											sx={{ p: 0.25 }}
										>
											<TuneIcon style={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
									<Typography variant="caption" color="text.secondary">
										{selectedChannels
											? selectedChannels.size
											: allChannels.length}
										/{allChannels.length} parâmetros
									</Typography>
									<Box sx={{ flex: 1 }} />
									<Tooltip title="Editar labels">
										<IconButton
											size="small"
											onClick={openLabelDialog}
											sx={{ p: 0.25 }}
										>
											<EditIcon style={{ fontSize: 14 }} />
										</IconButton>
									</Tooltip>
								</Box>

								<ChannelConfigPopover
									anchorEl={channelMenuAnchor}
									onClose={() => setChannelMenuAnchor(null)}
									allChannels={allChannels}
									selectedChannels={selectedChannels}
									visibleMetrics={visibleMetrics}
									metricColumns={METRIC_COLUMNS}
									channelLabel={channelLabel}
									onToggleChannel={toggleChannel}
									onToggleMetric={toggleMetric}
									onSelectAll={selectAll}
									onSelectFluorescence={selectFluorescence}
									onClearAll={clearAll}
								/>

								<StatsTable
									displayChannels={displayChannels}
									channelStats={channelStats}
									activeMetrics={activeMetrics}
									channelLabel={channelLabel}
								/>
							</>
						)}
					</Box>
				</Collapse>
			</Box>

			<ComparisonPanel
				selectableItems={selectableItems}
				files={files}
				activeMetrics={activeMetrics}
				channelLabel={channelLabel}
				onExport={handleExportComparison}
			/>

			{!channelStats && source.type === "gate" && (
				<Box sx={{ textAlign: "center", py: 3 }}>
					<Typography variant="body2" color="text.secondary">
						Calculando estatísticas...
					</Typography>
					<Typography variant="caption" color="text.secondary">
						As métricas serão exibidas em instantes.
					</Typography>
				</Box>
			)}

			<LabelEditDialog
				open={labelDialogOpen}
				allChannels={allChannels}
				channelLabelMap={channelLabelMap}
				editingLabels={editingLabels}
				onEditingLabelsChange={setEditingLabels}
				onSave={saveLabelDialog}
				onClearAll={() => setEditingLabels({})}
				onClose={() => setLabelDialogOpen(false)}
			/>

			<ExportDialog
				open={exportDialog.open}
				defaultName={exportDialog.defaultName}
				format={exportDialog.format}
				fileName={exportFileName}
				onFileNameChange={setExportFileName}
				onFormatChange={(fmt) =>
					setExportDialog((p) => ({ ...p, format: fmt }))
				}
				onExport={() => {
					const name = exportFileName.trim() || exportDialog.defaultName
					exportDialog.handler(name, exportDialog.format)
					setExportDialog((p) => ({ ...p, open: false }))
				}}
				onClose={() => setExportDialog((p) => ({ ...p, open: false }))}
			/>
		</Box>
	)
}
