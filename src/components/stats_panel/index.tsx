import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
	Box,
	Button,
	Checkbox,
	Chip,
	Collapse,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	Menu,
	MenuItem,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdBarChart as StatsIcon,
	MdFileDownload as ExportIcon,
	MdSelectAll as SelectAllIcon,
	MdDeselect as DeselectIcon,
	MdFilterList as FilterIcon,
	MdClose as CloseIcon,
	MdCompareArrows as CompareIcon,
	MdEdit as EditIcon,
	MdKeyboardArrowDown as ArrowDownIcon,
	MdChevronRight as ChevronIcon,
	MdExpandMore as ExpandMoreIcon,
	MdExpandLess as ExpandLessIcon,
	MdAdd as AddIcon,
	MdRemoveCircleOutline as RemoveIcon,
} from "react-icons/md"
import CytometryApi from "../../API"
import type { SelectedSource } from "../parent_tree"
import type {
	AnalysisResultData,
	ChannelStat,
	ExperimentFiles,
	Gate,
} from "../../types"

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

const DEFAULT_VISIBLE_METRICS = new Set<MetricColumn>(["mean_mfi", "median_mfi"])

const fmtPct = (v: number | undefined) =>
	v != null ? `${(v * 100).toFixed(2)}%` : "–"

const SCATTER_CHANNELS = ["fsc", "ssc", "time"]
const isFluorescence = (ch: string) =>
	!SCATTER_CHANNELS.some((s) => ch.toLowerCase().startsWith(s))

const normalizeChannelName = (name: string): string =>
	name.toLowerCase().replace(/ /g, "").replace(/-/g, "_")

const LS_KEY_CHANNELS = "pandora_stats_selectedChannels"
const LS_KEY_METRICS = "pandora_stats_visibleMetrics"
const LS_KEY_LABELS = "pandora_channel_labels"

// --- Selectable item for the hierarchical picker ---

interface SelectableItem {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
	path: string // ex: "sample.fcs > Lymphocytes > CD3+"
	depth: number
}

const buildSelectableItems = (files: ExperimentFiles[]): SelectableItem[] => {
	const items: SelectableItem[] = []
	for (const f of files) {
		items.push({
			type: "file",
			id: f.id,
			name: f.file_name,
			fileDataId: f.id,
			path: f.file_name,
			depth: 0,
		})
		const addGates = (gates: Gate[], parentPath: string, fileDataId: number, depth: number) => {
			for (const g of gates) {
				const p = `${parentPath} > ${g.name}`
				items.push({ type: "gate", id: g.id, name: g.name, fileDataId, path: p, depth })
				if (g.children) addGates(g.children, p, fileDataId, depth + 1)
			}
		}
		addGates(f.gates, f.file_name, f.id, 1)
	}
	return items
}

// --- Helpers ---

const findGateInTree = (gates: Gate[], id: number): Gate | undefined => {
	for (const g of gates) {
		if (g.id === id) return g
		if (g.children) {
			const found = findGateInTree(g.children, id)
			if (found) return found
		}
	}
	return undefined
}

const collectAllGates = (gates: Gate[]): Gate[] => {
	const result: Gate[] = []
	for (const g of gates) {
		result.push(g)
		if (g.children) result.push(...collectAllGates(g.children))
	}
	return result
}

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
	// --- Internal source selection (independent from plot) ---
	const [statsSource, setStatsSource] = useState<SelectableItem | null>(null)
	const [selectorAnchor, setSelectorAnchor] = useState<HTMLElement | null>(null)
	const [internalFileStats, setInternalFileStats] = useState<AnalysisResultData | null>(null)

	// Build hierarchical list of selectable items
	const selectableItems = useMemo(() => buildSelectableItems(files), [files])

	// Derive effective source: internal selection takes priority, fallback to external
	const source: SelectedSource | undefined = useMemo(() => {
		if (statsSource) {
			return { type: statsSource.type, id: statsSource.id, name: statsSource.name, fileDataId: statsSource.fileDataId }
		}
		return externalSource
	}, [statsSource, externalSource])

	// Derive effective fileStats
	const fileStats = statsSource ? internalFileStats : (externalFileStats ?? internalFileStats)

	// Fetch file stats when a file is selected internally
	useEffect(() => {
		if (source?.type === "file") {
			CytometryApi.get(`/experiment/file/${source.id}/stats`)
				.then((res) => setInternalFileStats(res.data))
				.catch(() => setInternalFileStats(null))
		} else {
			setInternalFileStats(null)
		}
	}, [source?.type, source?.id])

	// Auto-select first file if nothing is selected
	useEffect(() => {
		if (!statsSource && !externalSource && selectableItems.length > 0) {
			setStatsSource(selectableItems[0])
		}
	}, [statsSource, externalSource, selectableItems])

	// --- State ---
	const [search, setSearch] = useState("")
	const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricColumn>>(() => {
		try {
			const saved = localStorage.getItem(LS_KEY_METRICS)
			if (saved) return new Set(JSON.parse(saved) as MetricColumn[])
		} catch { /* ignore */ }
		return new Set(DEFAULT_VISIBLE_METRICS)
	})
	const [selectedChannels, setSelectedChannels] = useState<Set<string> | null>(null)
	const [compareExpanded, setCompareExpanded] = useState(false)
	const [compareItems, setCompareItems] = useState<SelectableItem[]>([])
	const [compareAnchor, setCompareAnchor] = useState<HTMLElement | null>(null)
	const [compareChannels, setCompareChannels] = useState<Set<string> | null>(null)
	const [customLabels, setCustomLabels] = useState<Record<string, string>>(() => {
		try {
			const saved = localStorage.getItem(LS_KEY_LABELS)
			if (saved) return JSON.parse(saved) as Record<string, string>
		} catch { /* ignore */ }
		return {}
	})
	const [labelDialogOpen, setLabelDialogOpen] = useState(false)
	const [editingLabels, setEditingLabels] = useState<Record<string, string>>({})

	// Resolve current gate
	const currentGate = useMemo(() => {
		if (!source || source.type !== "gate") return undefined
		for (const f of files) {
			const g = findGateInTree(f.gates, source.id)
			if (g) return g
		}
		return undefined
	}, [source, files])

	// Build mapping from normalized channel name to original label
	const channelLabelMap = useMemo(() => {
		const map: Record<string, string> = {}
		for (const v of values) {
			map[normalizeChannelName(v)] = v
		}
		return map
	}, [values])

	const channelLabel = useCallback(
		(ch: string) => {
			if (customLabels[ch]) return customLabels[ch]
			return channelLabelMap[ch] ?? ch
		},
		[channelLabelMap, customLabels],
	)

	// Persist custom labels
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

	// All channels from current gate's analysis or values
	const allChannels = useMemo(() => {
		const analysis = currentGate?.analysis_result?.analysis_result
		if (analysis?.channel_statistics) {
			return Object.keys(analysis.channel_statistics)
		}
		if (fileStats?.channel_statistics) {
			return Object.keys(fileStats.channel_statistics)
		}
		return values.map((v) => normalizeChannelName(v))
	}, [currentGate, fileStats, values])

	// Initialize selectedChannels from localStorage or all
	useEffect(() => {
		try {
			const saved = localStorage.getItem(LS_KEY_CHANNELS)
			if (saved) {
				const parsed = JSON.parse(saved) as string[]
				setSelectedChannels(new Set(parsed))
				return
			}
		} catch { /* ignore */ }
		setSelectedChannels(new Set(allChannels))
	}, []) // only on mount

	// If channels not initialized yet, set all
	useEffect(() => {
		if (selectedChannels === null && allChannels.length > 0) {
			setSelectedChannels(new Set(allChannels))
		}
	}, [allChannels, selectedChannels])

	// Persist to localStorage
	useEffect(() => {
		if (selectedChannels) {
			localStorage.setItem(LS_KEY_CHANNELS, JSON.stringify([...selectedChannels]))
		}
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

	// Filtered channels for the table
	const displayChannels = useMemo(() => {
		const channels = selectedChannels ?? new Set(allChannels)
		let filtered = allChannels.filter((ch) => channels.has(ch))
		if (search.trim()) {
			const q = search.toLowerCase()
			filtered = filtered.filter(
				(ch) => ch.toLowerCase().includes(q) || channelLabel(ch).toLowerCase().includes(q),
			)
		}
		return filtered
	}, [allChannels, selectedChannels, search, channelLabel])

	// Analysis data to display
	const analysisData: AnalysisResultData | undefined = useMemo(() => {
		if (currentGate?.analysis_result?.analysis_result) {
			return currentGate.analysis_result.analysis_result
		}
		if (source?.type === "file" && fileStats) {
			return fileStats
		}
		return undefined
	}, [currentGate, source, fileStats])

	// Resolve comparison items to gates/file data
	const compareData = useMemo(() => {
		if (compareItems.length === 0) return []
		return compareItems.map((item) => {
			if (item.type === "gate") {
				for (const f of files) {
					const g = findGateInTree(f.gates, item.id)
					if (g) return { item, gate: g, analysis: g.analysis_result?.analysis_result }
				}
			}
			return { item, gate: undefined, analysis: undefined }
		})
	}, [compareItems, files])

	// Channels available across all compare items
	const compareAvailableChannels = useMemo(() => {
		const channels = new Set<string>()
		for (const d of compareData) {
			const cs = d.analysis?.channel_statistics
			if (cs) Object.keys(cs).forEach((ch) => channels.add(ch))
		}
		return [...channels]
	}, [compareData])

	// Display channels for comparison (intersection of selected + available)
	const compareDisplayChannels = useMemo(() => {
		if (!compareChannels) return compareAvailableChannels
		return compareAvailableChannels.filter((ch) => compareChannels.has(ch))
	}, [compareAvailableChannels, compareChannels])

	const addCompareItem = useCallback((item: SelectableItem) => {
		setCompareItems((prev) => {
			if (prev.some((i) => i.type === item.type && i.id === item.id)) return prev
			return [...prev, item]
		})
	}, [])

	const removeCompareItem = useCallback((item: SelectableItem) => {
		setCompareItems((prev) => prev.filter((i) => !(i.type === item.type && i.id === item.id)))
	}, [])

	// --- Export ---
	const handleExport = useCallback(
		(scope: "current" | "all") => {
			const rows: string[][] = []
			const metricCols = METRIC_COLUMNS.filter((m) => visibleMetrics.has(m.key))
			const channelList = displayChannels

			// Header
			const header = ["Gate", "Count", "%Parent", "%Total"]
			for (const ch of channelList) {
				for (const m of metricCols) {
					header.push(`${channelLabel(ch)}_${m.shortLabel}`)
				}
			}
			rows.push(header)

			const addGateRow = (gate: Gate) => {
				const ar = gate.analysis_result?.analysis_result
				const sm = ar?.summary_metrics
				const cs = ar?.channel_statistics
				const row: string[] = [
					gate.name,
					String(sm?.count ?? ""),
					sm ? (sm.percent_of_parent_population * 100).toFixed(2) : "",
					sm ? (sm.percent_of_total_population * 100).toFixed(2) : "",
				]
				for (const ch of channelList) {
					const stat = cs?.[ch]
					for (const m of metricCols) {
						row.push(stat ? String(stat[m.key]) : "")
					}
				}
				rows.push(row)
			}

			if (scope === "current" && currentGate) {
				addGateRow(currentGate)
			} else if (scope === "all") {
				for (const f of files) {
					for (const g of collectAllGates(f.gates)) {
						addGateRow(g)
					}
				}
			} else if (scope === "current" && source?.type === "file" && fileStats) {
				const sm = fileStats.summary_metrics
				const cs = fileStats.channel_statistics
				const row: string[] = [
					source.name,
					String(sm?.count ?? ""),
					sm ? (sm.percent_of_parent_population * 100).toFixed(2) : "",
					sm ? (sm.percent_of_total_population * 100).toFixed(2) : "",
				]
				for (const ch of channelList) {
					const stat = cs?.[ch]
					for (const m of metricCols) {
						row.push(stat ? String(stat[m.key]) : "")
					}
				}
				rows.push(row)
			}

			// BOM + CSV
			const csvContent =
				"\uFEFF" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = `stats_${scope === "all" ? "all_gates" : (currentGate?.name ?? source?.name ?? "file")}.csv`
			a.click()
			URL.revokeObjectURL(url)
		},
		[currentGate, files, displayChannels, visibleMetrics, source, fileStats, channelLabel],
	)

	// --- Render ---

	// Current path display
	const currentPath = statsSource?.path ?? (source ? (source.type === "file" ? source.name : source.name) : null)

	// Hierarchical selector component
	const renderSourceSelector = () => (
		<>
			<Button
				size="small"
				variant="outlined"
				onClick={(e) => setSelectorAnchor(e.currentTarget)}
				endIcon={<ArrowDownIcon />}
				sx={{
					textTransform: "none",
					fontSize: "0.75rem",
					py: 0.25,
					px: 1,
					mb: 0.5,
					justifyContent: "space-between",
					width: "100%",
					overflow: "hidden",
				}}
			>
				<Typography
					variant="caption"
					noWrap
					sx={{ flex: 1, textAlign: "left", fontSize: "0.75rem" }}
				>
					{currentPath ?? "Selecionar..."}
				</Typography>
			</Button>
			<Menu
				anchorEl={selectorAnchor}
				open={Boolean(selectorAnchor)}
				onClose={() => setSelectorAnchor(null)}
				slotProps={{ paper: { sx: { maxHeight: 320, maxWidth: 340, minWidth: 220 } } }}
			>
				{selectableItems.map((item) => {
					const isSelected = source?.type === item.type && source?.id === item.id
					return (
						<MenuItem
							key={`${item.type}-${item.id}`}
							selected={isSelected}
							onClick={() => {
								setStatsSource(item)
								setSelectorAnchor(null)
							}}
							sx={{ py: 0.5, pl: 1.5 + item.depth * 2, minHeight: 0 }}
						>
							<Typography variant="caption" sx={{ fontSize: "0.75rem" }} noWrap>
								{item.depth > 0 && (
									<ChevronIcon style={{ fontSize: 12, verticalAlign: "middle", marginRight: 2, opacity: 0.5 }} />
								)}
								{item.type === "file" ? "📄 " : "🔲 "}
								{item.name}
							</Typography>
						</MenuItem>
					)
				})}
				{selectableItems.length === 0 && (
					<MenuItem disabled>
						<Typography variant="caption" color="text.secondary">Nenhum arquivo carregado</Typography>
					</MenuItem>
				)}
			</Menu>
		</>
	)

	// Empty state — show selector even when nothing is selected
	if (!source) {
		return (
			<Box sx={{ p: 2 }}>
				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
					<Typography variant="subtitle2" fontWeight="bold">
						<StatsIcon style={{ fontSize: 18, verticalAlign: "middle", marginRight: 4 }} />
						Estatísticas
					</Typography>
					{onClose && (
						<IconButton size="small" onClick={onClose}>
							<CloseIcon style={{ fontSize: 16 }} />
						</IconButton>
					)}
				</Box>
				{renderSourceSelector()}
				<Box sx={{ textAlign: "center", mt: 2 }}>
					<StatsIcon style={{ fontSize: 36, opacity: 0.3 }} />
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Selecione um gate ou arquivo acima para ver as estatísticas.
					</Typography>
				</Box>
			</Box>
		)
	}

	// File selected without stats (loading or unavailable)
	if (source.type === "file" && !fileStats) {
		return (
			<Box sx={{ p: 2 }}>
				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
					<Typography variant="subtitle2" fontWeight="bold">
						<StatsIcon style={{ fontSize: 18, verticalAlign: "middle", marginRight: 4 }} />
						Estatísticas
					</Typography>
					{onClose && (
						<IconButton size="small" onClick={onClose}>
							<CloseIcon style={{ fontSize: 16 }} />
						</IconButton>
					)}
				</Box>
				{renderSourceSelector()}
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
	const activeMetrics = METRIC_COLUMNS.filter((m) => visibleMetrics.has(m.key))

	return (
		<Box sx={{ p: 1.5, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
			{/* Header */}
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
				<Typography variant="subtitle2" fontWeight="bold">
					<StatsIcon style={{ fontSize: 18, verticalAlign: "middle", marginRight: 4 }} />
					Estatísticas
				</Typography>
				<Box sx={{ display: "flex", gap: 0.5 }}>
					<Tooltip title="Exportar gate atual (CSV)">
						<IconButton size="small" onClick={() => handleExport("current")}>
							<ExportIcon style={{ fontSize: 16 }} />
						</IconButton>
					</Tooltip>
					<Tooltip title="Exportar todos os gates (CSV)">
						<IconButton size="small" onClick={() => handleExport("all")}>
							<ExportIcon style={{ fontSize: 16, color: "#1976d2" }} />
						</IconButton>
					</Tooltip>
					{onClose && (
						<IconButton size="small" onClick={onClose}>
							<CloseIcon style={{ fontSize: 16 }} />
						</IconButton>
					)}
				</Box>
			</Box>

			{/* Source selector (path) */}
			{renderSourceSelector()}

			{/* Summary card */}
			{summary && (
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr 1fr",
						gap: 0.5,
						mb: 1,
						p: 1,
						bgcolor: "action.hover",
						borderRadius: 1,
					}}
				>
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary">
							Count
						</Typography>
						<Typography variant="body2" fontWeight="bold">
							{summary.count.toLocaleString()}
						</Typography>
					</Box>
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary">
							%P
						</Typography>
						<Typography variant="body2" fontWeight="bold">
							{fmtPct(summary.percent_of_parent_population)}
						</Typography>
					</Box>
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="caption" color="text.secondary">
							%T
						</Typography>
						<Typography variant="body2" fontWeight="bold">
							{fmtPct(summary.percent_of_total_population)}
						</Typography>
					</Box>
				</Box>
			)}

			{/* Collapsable comparison section */}

			{/* Channel selector */}
			{channelStats && (
				<>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
						<FilterIcon style={{ fontSize: 14, opacity: 0.6 }} />
						<Typography variant="caption" fontWeight="bold">
							Parâmetros
						</Typography>
						<Box sx={{ flex: 1 }} />
						<Tooltip title="Editar labels">
							<IconButton size="small" onClick={openLabelDialog} sx={{ p: 0.25 }}>
								<EditIcon style={{ fontSize: 14 }} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Todos">
							<IconButton size="small" onClick={selectAll} sx={{ p: 0.25 }}>
								<SelectAllIcon style={{ fontSize: 14 }} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Fluorescência">
							<Chip
								label="Fluoresc."
								size="small"
								variant="outlined"
								onClick={selectFluorescence}
								sx={{ height: 20, fontSize: "0.65rem" }}
							/>
						</Tooltip>
						<Tooltip title="Limpar">
							<IconButton size="small" onClick={clearAll} sx={{ p: 0.25 }}>
								<DeselectIcon style={{ fontSize: 14 }} />
							</IconButton>
						</Tooltip>
					</Box>

					<TextField
						size="small"
						placeholder="Buscar canal..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						sx={{ mb: 0.5, "& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 } }}
						fullWidth
					/>

					<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25, mb: 1, maxHeight: 80, overflow: "auto" }}>
						{allChannels
							.filter((ch) => !search.trim() || ch.toLowerCase().includes(search.toLowerCase()) || channelLabel(ch).toLowerCase().includes(search.toLowerCase()))
							.map((ch) => (
								<Chip
									key={ch}
									label={channelLabel(ch)}
									size="small"
									variant={selectedChannels?.has(ch) ? "filled" : "outlined"}
									color={selectedChannels?.has(ch) ? "primary" : "default"}
									onClick={() => toggleChannel(ch)}
									sx={{ height: 22, fontSize: "0.65rem" }}
								/>
							))}
					</Box>

					{/* Metric columns toggle */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
						<Typography variant="caption" fontWeight="bold">
							Colunas:
						</Typography>
						{METRIC_COLUMNS.map((m) => (
							<FormControlLabel
								key={m.key}
								control={
									<Checkbox
										size="small"
										checked={visibleMetrics.has(m.key)}
										onChange={() => toggleMetric(m.key)}
										sx={{ p: 0.25 }}
									/>
								}
								label={<Typography variant="caption" sx={{ fontSize: "0.65rem" }}>{m.shortLabel}</Typography>}
								sx={{ m: 0, mr: 0.5 }}
							/>
						))}
					</Box>

					{/* Stats table */}
					<TableContainer sx={{ flex: 1, overflow: "auto" }}>
						<Table size="small" stickyHeader>
							<TableHead>
								<TableRow>
									<TableCell sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: "bold", position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1 }}>
										Canal
									</TableCell>
									{activeMetrics.map((m) => (
										<TableCell
											key={m.key}
											align="right"
											sx={{ py: 0.5, px: 1, fontSize: "0.7rem", fontWeight: "bold" }}
										>
											{m.shortLabel}
										</TableCell>
									))}
								</TableRow>
							</TableHead>
							<TableBody>
								{displayChannels.map((ch) => {
									const stat = channelStats[ch]
									return (
										<TableRow key={ch} hover>
											<TableCell
												sx={{
													py: 0.25,
													px: 1,
													fontSize: "0.7rem",
													position: "sticky",
													left: 0,
													bgcolor: "background.paper",
													zIndex: 1,
												}}
											>
												{channelLabel(ch)}
											</TableCell>
											{activeMetrics.map((m) => (
												<TableCell
													key={m.key}
													align="right"
													sx={{ py: 0.25, px: 1, fontSize: "0.7rem" }}
												>
													{stat ? m.format(stat[m.key]) : "–"}
												</TableCell>
											))}
										</TableRow>
									)
								})}
								{displayChannels.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={activeMetrics.length + 1}
											sx={{ textAlign: "center", py: 2, fontSize: "0.75rem" }}
										>
											Nenhum canal selecionado
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</TableContainer>
				</>
			)}

			{/* Comparison panel — collapsable like Grafana row */}
			<Box sx={{ mt: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
				{/* Collapse header */}
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
					onClick={() => setCompareExpanded((p) => !p)}
				>
					{compareExpanded
						? <ExpandLessIcon style={{ fontSize: 16 }} />
						: <ExpandMoreIcon style={{ fontSize: 16 }} />
					}
					<CompareIcon style={{ fontSize: 14 }} />
					<Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>
						Comparação {compareItems.length > 0 ? `(${compareItems.length})` : ""}
					</Typography>
				</Box>

				<Collapse in={compareExpanded}>
					<Box sx={{ p: 1 }}>
						{/* Selector: add items to compare */}
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
							<Typography variant="caption" color="text.secondary">
								Populações:
							</Typography>
							<Button
								size="small"
								variant="outlined"
								startIcon={<AddIcon style={{ fontSize: 12 }} />}
								onClick={(e) => setCompareAnchor(e.currentTarget)}
								sx={{ textTransform: "none", fontSize: "0.7rem", py: 0, px: 0.5, minWidth: 0, height: 22 }}
							>
								Adicionar
							</Button>
							<Menu
								anchorEl={compareAnchor}
								open={Boolean(compareAnchor)}
								onClose={() => setCompareAnchor(null)}
								slotProps={{ paper: { sx: { maxHeight: 320, maxWidth: 340, minWidth: 220 } } }}
							>
								{selectableItems.map((item) => {
									const alreadyAdded = compareItems.some((i) => i.type === item.type && i.id === item.id)
									return (
										<MenuItem
											key={`cmp-${item.type}-${item.id}`}
											disabled={alreadyAdded}
											onClick={() => {
												addCompareItem(item)
												setCompareAnchor(null)
											}}
											sx={{ py: 0.5, pl: 1.5 + item.depth * 2, minHeight: 0 }}
										>
											<Typography variant="caption" sx={{ fontSize: "0.75rem" }} noWrap>
												{item.depth > 0 && (
													<ChevronIcon style={{ fontSize: 12, verticalAlign: "middle", marginRight: 2, opacity: 0.5 }} />
												)}
												{item.type === "file" ? "📄 " : "🔲 "}
												{item.name}
												{alreadyAdded ? " ✓" : ""}
											</Typography>
										</MenuItem>
									)
								})}
							</Menu>
						</Box>

						{/* List of selected compare items (removable chips) */}
						{compareItems.length > 0 && (
							<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 0.5 }}>
								{compareItems.map((item) => (
									<Chip
										key={`chip-${item.type}-${item.id}`}
										label={item.path}
										size="small"
										variant="outlined"
										onDelete={() => removeCompareItem(item)}
										sx={{ fontSize: "0.65rem", height: 20, maxWidth: 200, "& .MuiChip-label": { px: 0.5 } }}
									/>
								))}
							</Box>
						)}

						{/* Parameter selector for comparison */}
						{compareItems.length > 0 && compareAvailableChannels.length > 0 && (
							<Box sx={{ mb: 0.5 }}>
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
									<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
										Parâmetros:
									</Typography>
									<Chip
										label="Todos"
										size="small"
										variant={!compareChannels ? "filled" : "outlined"}
										onClick={() => setCompareChannels(null)}
										sx={{ fontSize: "0.6rem", height: 18 }}
									/>
									<Chip
										label="Fluoresc."
										size="small"
										variant="outlined"
										onClick={() => setCompareChannels(new Set(compareAvailableChannels.filter(isFluorescence)))}
										sx={{ fontSize: "0.6rem", height: 18 }}
									/>
									<Chip
										label="Limpar"
										size="small"
										variant="outlined"
										onClick={() => setCompareChannels(new Set())}
										sx={{ fontSize: "0.6rem", height: 18 }}
									/>
								</Box>
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25 }}>
									{compareAvailableChannels.map((ch) => {
										const selected = !compareChannels || compareChannels.has(ch)
										return (
											<Chip
												key={`cch-${ch}`}
												label={channelLabel(ch)}
												size="small"
												variant={selected ? "filled" : "outlined"}
												onClick={() => {
													setCompareChannels((prev) => {
														const next = new Set(prev ?? compareAvailableChannels)
														if (next.has(ch)) next.delete(ch)
														else next.add(ch)
														return next
													})
												}}
												sx={{ fontSize: "0.6rem", height: 18 }}
											/>
										)
									})}
								</Box>
							</Box>
						)}

						{/* Comparison table */}
						{compareData.length > 0 && (
							<TableContainer sx={{ maxHeight: 300, overflow: "auto" }}>
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell
												sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem", fontWeight: "bold", position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 2, minWidth: 80 }}
											>
												População
											</TableCell>
											<TableCell sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem", fontWeight: "bold" }} align="right">Count</TableCell>
											<TableCell sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem", fontWeight: "bold" }} align="right">%P</TableCell>
											<TableCell sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem", fontWeight: "bold" }} align="right">%T</TableCell>
											{compareDisplayChannels.map((ch) => (
												activeMetrics.map((m) => (
													<TableCell
														key={`h-${ch}-${m.key}`}
														sx={{ py: 0.25, px: 0.5, fontSize: "0.6rem", fontWeight: "bold", whiteSpace: "nowrap" }}
														align="right"
													>
														{channelLabel(ch)} {m.shortLabel}
													</TableCell>
												))
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										{compareData.map((d) => {
											const sm = d.analysis?.summary_metrics
											const cs = d.analysis?.channel_statistics
											return (
												<TableRow key={`${d.item.type}-${d.item.id}`} hover>
													<TableCell
														sx={{
															py: 0.25, px: 0.5, fontSize: "0.65rem",
															position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1,
															maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
														}}
													>
														<Tooltip title={d.item.path}>
															<span>{d.item.name}</span>
														</Tooltip>
													</TableCell>
													<TableCell sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem" }} align="right">
														{sm?.count?.toLocaleString() ?? "–"}
													</TableCell>
													<TableCell sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem" }} align="right">
														{fmtPct(sm?.percent_of_parent_population)}
													</TableCell>
													<TableCell sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem" }} align="right">
														{fmtPct(sm?.percent_of_total_population)}
													</TableCell>
													{compareDisplayChannels.map((ch) => {
														const stat = cs?.[ch]
														return activeMetrics.map((m) => (
															<TableCell
																key={`${d.item.id}-${ch}-${m.key}`}
																sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem" }}
																align="right"
															>
																{stat ? m.format(stat[m.key]) : "–"}
															</TableCell>
														))
													})}
												</TableRow>
											)
										})}
									</TableBody>
								</Table>
							</TableContainer>
						)}

						{compareItems.length === 0 && (
							<Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", py: 1 }}>
								Adicione populações acima para comparar (ex: controle vs marcado)
							</Typography>
						)}
					</Box>
				</Collapse>
			</Box>

			{/* Loading state */}
			{!channelStats && source.type === "gate" && (
				<Box sx={{ textAlign: "center", py: 3 }}>
					<Typography variant="body2" color="text.secondary">
						⏳ Calculando estatísticas...
					</Typography>
					<Typography variant="caption" color="text.secondary">
						As métricas serão exibidas em instantes.
					</Typography>
				</Box>
			)}

			{/* Label editing dialog */}
			<Dialog open={labelDialogOpen} onClose={() => setLabelDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle sx={{ fontSize: "0.95rem" }}>Editar Labels dos Canais</DialogTitle>
				<DialogContent>
					<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
						Adicione labels customizados (ex: FITC-A → CFSE). O nome original do canal é preservado.
					</Typography>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell sx={{ py: 0.5, fontSize: "0.75rem", fontWeight: "bold" }}>Canal Original</TableCell>
								<TableCell sx={{ py: 0.5, fontSize: "0.75rem", fontWeight: "bold" }}>Label Customizado</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{allChannels.map((ch) => (
								<TableRow key={ch}>
									<TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
										{channelLabelMap[ch] ?? ch}
									</TableCell>
									<TableCell sx={{ py: 0.25 }}>
										<TextField
											size="small"
											placeholder={channelLabelMap[ch] ?? ch}
											value={editingLabels[ch] ?? ""}
											onChange={(e) => setEditingLabels((prev) => ({ ...prev, [ch]: e.target.value }))}
											sx={{ "& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 } }}
											fullWidth
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</DialogContent>
				<DialogActions>
					<Button size="small" onClick={() => { setEditingLabels({}); }}>
						Limpar Todos
					</Button>
					<Box sx={{ flex: 1 }} />
					<Button size="small" onClick={() => setLabelDialogOpen(false)}>Cancelar</Button>
					<Button size="small" variant="contained" onClick={saveLabelDialog}>Salvar</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}
