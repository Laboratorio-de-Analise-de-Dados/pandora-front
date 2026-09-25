import { useMemo, useState } from "react"
import {
	Box,
	Checkbox,
	ListItemText,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material"
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
	const visibleChannels = useMemo(
		() => channels.filter((c) => !hiddenCols.has(c)),
		[channels, hiddenCols],
	)

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
				<Select
					multiple
					size="small"
					value={visibleChannels}
					renderValue={() => "Colunas"}
					onChange={(e) => {
						const sel = e.target.value as string[]
						setHiddenCols(new Set(channels.filter((c) => !sel.includes(c))))
					}}
					sx={{
						fontSize: "0.75rem",
						minWidth: 0,
						"& .MuiSelect-select": { py: 0.25, pr: 3 },
					}}
					MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
				>
					{channels.map((ch) => (
						<MenuItem key={ch} value={ch} dense>
							<Checkbox size="small" checked={!hiddenCols.has(ch)} />
							<ListItemText
								primary={ch}
								primaryTypographyProps={{ variant: "caption" }}
							/>
						</MenuItem>
					))}
				</Select>
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
