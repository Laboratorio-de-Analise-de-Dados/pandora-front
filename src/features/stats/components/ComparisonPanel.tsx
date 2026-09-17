import React, { useCallback, useMemo, useState } from "react"
import {
	Box,
	Button,
	Checkbox,
	Chip,
	Collapse,
	FormControlLabel,
	IconButton,
	Popover,
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
	MdFileDownload as ExportIcon,
	MdCompareArrows as CompareIcon,
	MdExpandMore as ExpandMoreIcon,
	MdExpandLess as ExpandLessIcon,
	MdChecklist as SelectIcon,
	MdChevronRight as ChevronIcon,
	MdTune as TuneIcon,
} from "react-icons/md"
import { FaVial as VialIcon } from "react-icons/fa"
import type { ExperimentFiles, Gate } from "../../../types"
import {
	findGateInTree,
	findFileForGate,
	getGateStrategy,
} from "../../gate/utils"
import { isFluorescence } from "../utils/channelHelpers"
import { buildAnalysisRows } from "../utils/statsRows"
import type { PopulationRow } from "../utils/statsRows"
import { fmtPct } from "../../../utils/format"
import type { SelectableItem } from "./SourceSelector"
import { useComparisonStats } from "../hooks/useComparisonStats"

interface MetricDef {
	key: "mean_mfi" | "median_mfi" | "std_dev" | "cv"
	shortLabel: string
	format: (v: number) => string
}

interface ComparisonPanelProps {
	selectableItems: SelectableItem[]
	files: ExperimentFiles[]
	activeMetrics: MetricDef[]
	channelLabel: (ch: string) => string
	onExport: (
		rows: string[][],
		defaultName: string,
		format: "csv" | "xlsx",
	) => void
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
	selectableItems,
	files,
	activeMetrics,
	channelLabel,
	onExport,
}) => {
	const [expanded, setExpanded] = useState(false)
	const [compareItems, setCompareItems] = useState<SelectableItem[]>([])
	const [compareAnchor, setCompareAnchor] = useState<HTMLElement | null>(null)
	const [compareSelectSearch, setCompareSelectSearch] = useState("")
	const [compareChannels, setCompareChannels] = useState<Set<string> | null>(
		null,
	)
	const [compareChannelMenuAnchor, setCompareChannelMenuAnchor] =
		useState<HTMLElement | null>(null)
	const [compareChannelMenuSearch, setCompareChannelMenuSearch] = useState("")

	const { compareData } = useComparisonStats(compareItems, files)

	const compareAvailableChannels = useMemo(() => {
		const channels = new Set<string>()
		for (const d of compareData) {
			const cs = d.analysis?.channel_statistics
			if (cs) Object.keys(cs).forEach((ch) => channels.add(ch))
		}
		return [...channels]
	}, [compareData])

	const compareDisplayChannels = useMemo(() => {
		if (!compareChannels) return compareAvailableChannels
		return compareAvailableChannels.filter((ch) => compareChannels.has(ch))
	}, [compareAvailableChannels, compareChannels])

	const isItemSelected = (item: SelectableItem) =>
		compareItems.some((i) => i.type === item.type && i.id === item.id)

	const addCompareItem = (item: SelectableItem) => {
		setCompareItems((prev) => {
			if (prev.some((i) => i.type === item.type && i.id === item.id))
				return prev
			return [...prev, item]
		})
	}

	const removeCompareItem = (item: SelectableItem) => {
		setCompareItems((prev) =>
			prev.filter((i) => !(i.type === item.type && i.id === item.id)),
		)
	}

	const toggleCompareItem = (item: SelectableItem) => {
		if (isItemSelected(item)) removeCompareItem(item)
		else addCompareItem(item)
	}

	// Atalho "o mesmo gate em todos os arquivos": os grupos vêm da linhagem de
	// cópias (`groupKey`), então uma cópia editada só naquela amostra — já
	// desanexada no backend — aparece como um grupo separado, mesmo com o mesmo
	// nome. Quando dois grupos têm o mesmo nome, o rótulo mostra o caminho.
	const gateGroups = useMemo(() => {
		const groups = new Map<string, SelectableItem[]>()
		for (const item of selectableItems) {
			if (item.type !== "gate") continue
			const existing = groups.get(item.groupKey)
			if (existing) existing.push(item)
			else groups.set(item.groupKey, [item])
		}
		const nameCount = new Map<string, number>()
		for (const items of groups.values()) {
			const name = items[0].name
			nameCount.set(name, (nameCount.get(name) ?? 0) + 1)
		}
		return [...groups.entries()].map(([key, items]) => ({
			key,
			items,
			label:
				(nameCount.get(items[0].name) ?? 0) > 1
					? items[0].gatePath
					: items[0].name,
			tooltip: items.map((i) => i.path).join("\n"),
		}))
	}, [selectableItems])

	const isGateGroupFullySelected = (items: SelectableItem[]) =>
		items.length > 0 && items.every(isItemSelected)

	const toggleGateGroup = (items: SelectableItem[]) => {
		if (isGateGroupFullySelected(items)) {
			setCompareItems((prev) =>
				prev.filter(
					(i) => !items.some((it) => it.type === i.type && it.id === i.id),
				),
			)
		} else {
			setCompareItems((prev) => {
				const next = [...prev]
				for (const it of items) {
					if (!next.some((i) => i.type === it.type && i.id === it.id))
						next.push(it)
				}
				return next
			})
		}
	}

	const selectAllItems = () => setCompareItems([...selectableItems])
	const clearAllItems = () => setCompareItems([])

	const filteredSelectableItems = useMemo(() => {
		const q = compareSelectSearch.trim().toLowerCase()
		if (!q) return selectableItems
		return selectableItems.filter(
			(item) =>
				item.name.toLowerCase().includes(q) ||
				item.path.toLowerCase().includes(q),
		)
	}, [selectableItems, compareSelectSearch])

	const handleExportClick = useCallback(
		(format: "csv" | "xlsx") => {
			const metricCols = activeMetrics.map((m) => ({
				key: m.key,
				shortLabel: m.shortLabel,
			}))
			const populations: PopulationRow[] = compareData.map((d) => ({
				fileName:
					d.item.type === "file"
						? d.item.name
						: (findFileForGate(files, d.item.id)?.file_name ?? ""),
				strategy:
					d.item.type === "gate" ? getGateStrategy(files, d.item.id) : "",
				name: d.item.name,
				analysis: d.analysis,
			}))
			const rows = buildAnalysisRows(
				populations,
				compareDisplayChannels,
				metricCols,
				channelLabel,
			)
			onExport(rows, "comparacao", format)
		},
		[
			activeMetrics,
			compareData,
			compareDisplayChannels,
			files,
			channelLabel,
			onExport,
		],
	)

	return (
		<Box sx={{ mt: 1 }}>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 0.5,
					px: 0.5,
					py: 0.5,
					borderRadius: 2,
					cursor: "pointer",
					color: "text.secondary",
					"&:hover": {
						bgcolor: "action.hover",
						color: "text.primary",
					},
				}}
				onClick={() => setExpanded((p) => !p)}
			>
				{expanded ? (
					<ExpandLessIcon style={{ fontSize: 16 }} />
				) : (
					<ExpandMoreIcon style={{ fontSize: 16 }} />
				)}
				<CompareIcon style={{ fontSize: 14 }} />
				<Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>
					Comparação {compareItems.length > 0 ? `(${compareItems.length})` : ""}
				</Typography>
				{compareData.length > 0 && (
					<Box
						sx={{ display: "flex", gap: 0.25 }}
						onClick={(e) => e.stopPropagation()}
					>
						<Tooltip title="Exportar CSV">
							<IconButton
								size="small"
								onClick={() => handleExportClick("csv")}
								sx={{ p: 0.25 }}
							>
								<ExportIcon style={{ fontSize: 14 }} />
							</IconButton>
						</Tooltip>
						<Tooltip title="Exportar Excel (.xlsx)">
							<IconButton
								size="small"
								onClick={() => handleExportClick("xlsx")}
								sx={{ p: 0.25 }}
							>
								<ExportIcon
									style={{
										fontSize: 14,
										color: "var(--mui-palette-primary-main, #10B981)",
									}}
								/>
							</IconButton>
						</Tooltip>
					</Box>
				)}
			</Box>

			<Collapse in={expanded}>
				<Box sx={{ px: 0.5, pt: 0.5 }}>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
					>
						<Typography variant="caption" color="text.secondary">
							Populações:
						</Typography>
						<Button
							size="small"
							variant="outlined"
							startIcon={<SelectIcon style={{ fontSize: 12 }} />}
							onClick={(e) => setCompareAnchor(e.currentTarget)}
							sx={{
								textTransform: "none",
								fontSize: "0.7rem",
								py: 0,
								px: 0.5,
								minWidth: 0,
								height: 22,
							}}
						>
							Selecionar
						</Button>
						<Popover
							anchorEl={compareAnchor}
							open={Boolean(compareAnchor)}
							onClose={() => {
								setCompareAnchor(null)
								setCompareSelectSearch("")
							}}
							anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
							slotProps={{
								paper: { sx: { width: 320, maxHeight: 420, p: 1.5 } },
							}}
						>
							<Typography
								variant="caption"
								fontWeight="bold"
								sx={{ mb: 0.5, display: "block" }}
							>
								Selecionar populações
							</Typography>
							<TextField
								size="small"
								placeholder="Buscar arquivo ou gate..."
								value={compareSelectSearch}
								onChange={(e) => setCompareSelectSearch(e.target.value)}
								sx={{
									mb: 0.5,
									"& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 },
								}}
								fullWidth
								autoFocus
							/>
							<Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
								<Chip
									label="Todos"
									size="small"
									variant="outlined"
									onClick={selectAllItems}
									sx={{ fontSize: "0.6rem", height: 20 }}
								/>
								<Chip
									label="Limpar"
									size="small"
									variant="outlined"
									onClick={clearAllItems}
									sx={{ fontSize: "0.6rem", height: 20 }}
								/>
							</Box>

							{gateGroups.length > 0 && (
								<Box sx={{ mb: 0.5 }}>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ fontSize: "0.6rem", display: "block", mb: 0.25 }}
									>
										Mesmo gate em todos os arquivos:
									</Typography>
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
										{gateGroups.map((group) => {
											const full = isGateGroupFullySelected(group.items)
											return (
												<Tooltip key={group.key} title={group.tooltip}>
													<Chip
														label={`${group.label} (${group.items.length})`}
														size="small"
														variant={full ? "filled" : "outlined"}
														color={full ? "primary" : "default"}
														onClick={() => toggleGateGroup(group.items)}
														sx={{
															fontSize: "0.6rem",
															height: 20,
															maxWidth: 180,
														}}
													/>
												</Tooltip>
											)
										})}
									</Box>
								</Box>
							)}

							<Box sx={{ maxHeight: 220, overflow: "auto" }}>
								{filteredSelectableItems.map((item) => (
									<Tooltip
										key={`cmp-${item.type}-${item.id}`}
										title={item.path}
									>
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={isItemSelected(item)}
													onChange={() => toggleCompareItem(item)}
													sx={{ p: 0.25 }}
												/>
											}
											label={
												<Typography
													variant="caption"
													sx={{ fontSize: "0.72rem" }}
													noWrap
												>
													{item.depth > 0 && (
														<ChevronIcon
															style={{
																fontSize: 12,
																verticalAlign: "middle",
																marginRight: 2,
																opacity: 0.5,
															}}
														/>
													)}
													{item.type === "file" ? "📄 " : "🔲 "}
													{item.name}
												</Typography>
											}
											sx={{
												display: "flex",
												m: 0,
												minHeight: 26,
												pl: item.depth * 1.5,
											}}
										/>
									</Tooltip>
								))}
								{filteredSelectableItems.length === 0 && (
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ display: "block", textAlign: "center", py: 1 }}
									>
										Nenhum item encontrado
									</Typography>
								)}
							</Box>
						</Popover>
					</Box>

					{compareItems.length > 0 && compareAvailableChannels.length > 0 && (
						<Box
							sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
						>
							<Tooltip title="Configurar parâmetros da comparação">
								<IconButton
									size="small"
									onClick={(e) => setCompareChannelMenuAnchor(e.currentTarget)}
									sx={{ p: 0.25 }}
								>
									<TuneIcon style={{ fontSize: 14 }} />
								</IconButton>
							</Tooltip>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ fontSize: "0.65rem" }}
							>
								{compareChannels
									? compareChannels.size
									: compareAvailableChannels.length}
								/{compareAvailableChannels.length} parâmetros
							</Typography>
						</Box>
					)}

					<Popover
						open={Boolean(compareChannelMenuAnchor)}
						anchorEl={compareChannelMenuAnchor}
						onClose={() => {
							setCompareChannelMenuAnchor(null)
							setCompareChannelMenuSearch("")
						}}
						anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
						slotProps={{
							paper: { sx: { width: 280, maxHeight: 380, p: 1.5 } },
						}}
					>
						<Typography
							variant="caption"
							fontWeight="bold"
							sx={{ mb: 0.5, display: "block" }}
						>
							Parâmetros da Comparação
						</Typography>
						<TextField
							size="small"
							placeholder="Buscar canal..."
							value={compareChannelMenuSearch}
							onChange={(e) => setCompareChannelMenuSearch(e.target.value)}
							sx={{
								mb: 0.5,
								"& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 },
							}}
							fullWidth
							autoFocus
						/>
						<Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
							<Chip
								label="Todos"
								size="small"
								variant="outlined"
								onClick={() => setCompareChannels(null)}
								sx={{ fontSize: "0.6rem", height: 20 }}
							/>
							<Chip
								label="Fluoresc."
								size="small"
								variant="outlined"
								onClick={() =>
									setCompareChannels(
										new Set(compareAvailableChannels.filter(isFluorescence)),
									)
								}
								sx={{ fontSize: "0.6rem", height: 20 }}
							/>
							<Chip
								label="Limpar"
								size="small"
								variant="outlined"
								onClick={() => setCompareChannels(new Set())}
								sx={{ fontSize: "0.6rem", height: 20 }}
							/>
						</Box>
						<Box sx={{ maxHeight: 240, overflow: "auto" }}>
							{compareAvailableChannels
								.filter((ch) => {
									if (!compareChannelMenuSearch.trim()) return true
									const q = compareChannelMenuSearch.toLowerCase()
									return (
										ch.toLowerCase().includes(q) ||
										channelLabel(ch).toLowerCase().includes(q)
									)
								})
								.map((ch) => {
									const selected = !compareChannels || compareChannels.has(ch)
									return (
										<FormControlLabel
											key={`cch-${ch}`}
											control={
												<Checkbox
													size="small"
													checked={selected}
													onChange={() => {
														setCompareChannels((prev) => {
															const next = new Set(
																prev ?? compareAvailableChannels,
															)
															if (next.has(ch)) next.delete(ch)
															else next.add(ch)
															return next
														})
													}}
													sx={{ p: 0.25 }}
												/>
											}
											label={
												<Typography
													variant="caption"
													sx={{ fontSize: "0.7rem" }}
												>
													{channelLabel(ch)}
												</Typography>
											}
											sx={{ display: "block", m: 0, height: 26 }}
										/>
									)
								})}
						</Box>
					</Popover>

					{compareData.length > 0 && (
						<TableContainer sx={{ maxHeight: 300, overflow: "auto" }}>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell
											sx={{
												py: 0.25,
												px: 0.5,
												fontSize: "0.65rem",
												fontWeight: "bold",
												position: "sticky",
												left: 0,
												bgcolor: "background.paper",
												zIndex: 2,
												minWidth: 80,
											}}
										>
											População
										</TableCell>
										<TableCell
											sx={{
												py: 0.25,
												px: 0.5,
												fontSize: "0.65rem",
												fontWeight: "bold",
											}}
											align="right"
										>
											Count
										</TableCell>
										<TableCell
											sx={{
												py: 0.25,
												px: 0.5,
												fontSize: "0.65rem",
												fontWeight: "bold",
											}}
											align="right"
										>
											%P
										</TableCell>
										<TableCell
											sx={{
												py: 0.25,
												px: 0.5,
												fontSize: "0.65rem",
												fontWeight: "bold",
											}}
											align="right"
										>
											%T
										</TableCell>
										{compareDisplayChannels.map((ch) =>
											activeMetrics.map((m) => (
												<TableCell
													key={`h-${ch}-${m.key}`}
													sx={{
														py: 0.25,
														px: 0.5,
														fontSize: "0.6rem",
														fontWeight: "bold",
														whiteSpace: "nowrap",
													}}
													align="right"
												>
													{channelLabel(ch)} {m.shortLabel}
												</TableCell>
											)),
										)}
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
														py: 0.25,
														px: 0.5,
														fontSize: "0.65rem",
														position: "sticky",
														left: 0,
														bgcolor: "background.paper",
														zIndex: 1,
														maxWidth: 120,
														overflow: "hidden",
														textOverflow: "ellipsis",
														whiteSpace: "nowrap",
													}}
												>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.25,
														}}
													>
														<Tooltip
															title={
																d.item.type === "file"
																	? d.item.name
																	: (findFileForGate(files, d.item.id)
																			?.file_name ?? "")
															}
														>
															<span
																style={{
																	display: "inline-flex",
																	cursor: "help",
																}}
															>
																<VialIcon
																	style={{
																		fontSize: 11,
																		color: d.item.color ?? "#999",
																	}}
																/>
															</span>
														</Tooltip>
														<Tooltip title={d.item.path}>
															<span>{d.item.name}</span>
														</Tooltip>
													</Box>
												</TableCell>
												<TableCell
													sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem" }}
													align="right"
												>
													{sm?.count?.toLocaleString() ?? "–"}
												</TableCell>
												<TableCell
													sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem" }}
													align="right"
												>
													{fmtPct(sm?.percent_of_parent_population)}
												</TableCell>
												<TableCell
													sx={{ py: 0.25, px: 0.5, fontSize: "0.65rem" }}
													align="right"
												>
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
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block", textAlign: "center", py: 1 }}
						>
							Adicione populações acima para comparar (ex: controle vs marcado)
						</Typography>
					)}
				</Box>
			</Collapse>
		</Box>
	)
}

export default ComparisonPanel
