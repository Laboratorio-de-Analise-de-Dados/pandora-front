import React from "react"
import {
	Box,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
} from "@mui/material"
import { MdEdit as EditIcon } from "react-icons/md"
import type { ChannelStat } from "../../../types"

interface MetricDef {
	key: "mean_mfi" | "median_mfi" | "std_dev" | "cv"
	shortLabel: string
	format: (v: number) => string
}

interface StatsTableProps {
	displayChannels: string[]
	channelStats: Record<string, ChannelStat>
	activeMetrics: MetricDef[]
	channelLabel: (ch: string) => string
	/** FE-51: presente quando o usuário pode editar labels — o nome do
	 * canal vira affordance clicável que abre o rename. */
	onChannelClick?: (ch: string) => void
}

const StatsTable: React.FC<StatsTableProps> = ({
	displayChannels,
	channelStats,
	activeMetrics,
	channelLabel,
	onChannelClick,
}) => (
	<TableContainer sx={{ flex: 1, overflow: "auto" }}>
		<Table size="small" stickyHeader>
			<TableHead>
				<TableRow>
					<TableCell
						sx={{
							py: 0.5,
							px: 1,
							fontSize: "0.7rem",
							fontWeight: "bold",
							position: "sticky",
							left: 0,
							bgcolor: "background.paper",
							zIndex: 1,
						}}
					>
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
						<TableRow
							key={ch}
							hover
							sx={(theme) => ({
								// Linhas zebradas (FE-26): surface/surface-alt nos dois modos.
								"&:nth-of-type(even) td": {
									bgcolor:
										theme.palette.mode === "dark" ? "#1A1A1A" : "#FAFAFA",
								},
							})}
						>
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
								{onChannelClick ? (
									<Tooltip title="Renomear canal…">
										<Box
											component="span"
											onClick={() => onChannelClick(ch)}
											sx={(theme) => ({
												cursor: "pointer",
												display: "inline-flex",
												alignItems: "center",
												gap: 1,
												"&:hover": {
													color: theme.palette.primary.main,
													textDecoration: "underline",
												},
											})}
										>
											{channelLabel(ch)}
											<EditIcon
												style={{
													fontSize: 11,
													opacity: 0.6,
													flexShrink: 0,
												}}
											/>
										</Box>
									</Tooltip>
								) : (
									channelLabel(ch)
								)}
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
)

export default StatsTable
