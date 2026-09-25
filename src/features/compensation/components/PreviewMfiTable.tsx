import { useMemo, useState } from "react"
import {
	Box,
	Button,
	Checkbox,
	Chip,
	FormControlLabel,
	Popover,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from "@mui/material"
import { MdArrowDropDown as ArrowDropDownIcon } from "react-icons/md"
import { defaultScale } from "../../plot/utils/biex"
import type { CompensationChannelStats } from "../../../services/compensationService"

interface PreviewMfiTableProps {
	/** `channel_stats` da prévia: "file" + ids de gate como chave. */
	stats: CompensationChannelStats
	/** Canais da matriz em edição — colunas da tabela. */
	channels: string[]
	/** Populações selecionadas (gates) na ordem de exibição. */
	gateIds: number[]
	/** Resolve id de gate → nome para a primeira coluna. */
	gateLabel: (id: number) => string
}

const formatMfi = (v: number | null): string =>
	v == null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })

/**
 * Tabela de MFI da prévia de compensação (FE-41): linhas = populações
 * (amostra inteira + gates selecionados), colunas = canais da matriz.
 * A mediana é o número que o ajuste manual compara — negativo vs
 * positivo no canal de spillover devem convergir.
 */
export default function PreviewMfiTable({
	stats,
	channels,
	gateIds,
	gateLabel,
}: PreviewMfiTableProps) {
	// Colunas visíveis — guardo as ESCONDIDAS pra canal novo entrar visível.
	const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())
	const [colsAnchor, setColsAnchor] = useState<HTMLElement | null>(null)
	const [colSearch, setColSearch] = useState("")
	const visibleChannels = useMemo(
		() => channels.filter((c) => !hiddenCols.has(c)),
		[channels, hiddenCols],
	)

	const toggleCol = (ch: string) =>
		setHiddenCols((prev) => {
			const next = new Set(prev)
			if (next.has(ch)) next.delete(ch)
			else next.add(ch)
			return next
		})

	const rows = useMemo(
		() =>
			[
				{ key: "file", label: "Amostra inteira" },
				...gateIds.map((id) => ({
					key: String(id),
					label: gateLabel(id),
				})),
			].filter((r) => stats[r.key] != null),
		[stats, gateIds, gateLabel],
	)

	if (!rows.length) return null

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 1,
				}}
			>
				<Typography variant="caption" fontWeight={700}>
					Mediana (MFI) por população
				</Typography>
				<Button
					size="small"
					variant="outlined"
					endIcon={<ArrowDropDownIcon />}
					onClick={(e) => setColsAnchor(e.currentTarget)}
					sx={{
						fontSize: "0.7rem",
						textTransform: "none",
						py: 0,
						px: 1,
						minWidth: 0,
					}}
				>
					Colunas
				</Button>
				<Popover
					open={Boolean(colsAnchor)}
					anchorEl={colsAnchor}
					onClose={() => {
						setColsAnchor(null)
						setColSearch("")
					}}
					anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
					transformOrigin={{ vertical: "top", horizontal: "right" }}
					slotProps={{ paper: { sx: { width: 220, maxHeight: 380, p: 1.5 } } }}
				>
					<TextField
						size="small"
						placeholder="Buscar canal…"
						value={colSearch}
						onChange={(e) => setColSearch(e.target.value)}
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
							onClick={() => setHiddenCols(new Set())}
							sx={{ fontSize: "0.6rem", height: 20 }}
						/>
						<Chip
							label="Fluoresc."
							size="small"
							variant="outlined"
							onClick={() =>
								setHiddenCols(
									new Set(channels.filter((c) => defaultScale(c) === "linear")),
								)
							}
							sx={{ fontSize: "0.6rem", height: 20 }}
						/>
						<Chip
							label="Limpar"
							size="small"
							variant="outlined"
							onClick={() => setHiddenCols(new Set(channels))}
							sx={{ fontSize: "0.6rem", height: 20 }}
						/>
					</Box>
					<Box sx={{ maxHeight: 260, overflow: "auto" }}>
						{channels
							.filter((ch) =>
								colSearch.trim()
									? ch.toLowerCase().includes(colSearch.toLowerCase())
									: true,
							)
							.map((ch) => (
								<FormControlLabel
									key={ch}
									control={
										<Checkbox
											size="small"
											checked={!hiddenCols.has(ch)}
											onChange={() => toggleCol(ch)}
											sx={{ p: 0.25 }}
										/>
									}
									label={
										<Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
											{ch}
										</Typography>
									}
									sx={{ display: "block", m: 0, height: 26 }}
								/>
							))}
					</Box>
				</Popover>
			</Box>
			<TableContainer sx={{ maxHeight: 200, overflowX: "auto" }}>
				<Table size="small" stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell sx={{ fontWeight: 700, py: 0.5 }}>População</TableCell>
							{visibleChannels.map((ch) => (
								<TableCell
									key={ch}
									align="right"
									sx={{ fontWeight: 700, py: 0.5 }}
								>
									{ch}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{rows.map((row) => {
							const pop = stats[row.key]
							const count =
								pop != null ? Object.values(pop)[0]?.count : undefined
							return (
								<TableRow key={row.key}>
									<TableCell component="th" scope="row" sx={{ py: 0.5 }}>
										{row.label}
										{count != null && (
											<Typography
												component="span"
												variant="caption"
												color="text.secondary"
												sx={{ ml: 0.5 }}
											>
												({count.toLocaleString("pt-BR")})
											</Typography>
										)}
									</TableCell>
									{visibleChannels.map((ch) => (
										<TableCell key={ch} align="right" sx={{ py: 0.5 }}>
											{formatMfi(pop?.[ch]?.median ?? null)}
										</TableCell>
									))}
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</Box>
	)
}
