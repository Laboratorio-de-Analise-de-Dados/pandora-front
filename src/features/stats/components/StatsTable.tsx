import React from "react"
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material"
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
}

const StatsTable: React.FC<StatsTableProps> = ({
	displayChannels,
	channelStats,
	activeMetrics,
	channelLabel,
}) => (
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
)

export default StatsTable
