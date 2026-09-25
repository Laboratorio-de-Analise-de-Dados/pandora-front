import { useMemo } from "react"
import {
	Box,
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
			<Typography variant="caption" fontWeight={700} display="block">
				Mediana (MFI) por população
			</Typography>
			<TableContainer sx={{ maxHeight: 200, overflowX: "auto" }}>
				<Table size="small" stickyHeader>
					<TableHead>
						<TableRow>
							<TableCell sx={{ fontWeight: 700, py: 0.5 }}>População</TableCell>
							{channels.map((ch) => (
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
									{channels.map((ch) => (
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
