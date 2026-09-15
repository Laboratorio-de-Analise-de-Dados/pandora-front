import React from "react"
import { Box, Typography } from "@mui/material"
import type { SummaryMetrics } from "../../../types"
import { fmtPct } from "../../../utils/format"

interface StatsSummaryCardProps {
	summary: SummaryMetrics
}

/** Placas de métricas (FE-26): valor grande em branco sobre fundo canvas. */
const Metric = ({ label, value }: { label: string; value: string }) => (
	<Box
		sx={(theme) => ({
			textAlign: "center",
			py: 1,
			px: 0.5,
			borderRadius: 2,
			bgcolor:
				theme.palette.mode === "dark"
					? theme.palette.background.default
					: theme.palette.action.hover,
			border: `1px solid ${theme.palette.divider}`,
		})}
	>
		<Typography
			variant="caption"
			color="text.secondary"
			sx={{ display: "block", fontSize: "0.65rem", letterSpacing: "0.04em" }}
		>
			{label}
		</Typography>
		<Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
			{value}
		</Typography>
	</Box>
)

const StatsSummaryCard: React.FC<StatsSummaryCardProps> = ({ summary }) => (
	<Box
		sx={{
			display: "grid",
			gridTemplateColumns: "1fr 1fr 1fr",
			gap: 0.75,
			mb: 1,
		}}
	>
		<Metric label="Count" value={summary.count.toLocaleString()} />
		<Metric label="%P" value={fmtPct(summary.percent_of_parent_population)} />
		<Metric label="%T" value={fmtPct(summary.percent_of_total_population)} />
	</Box>
)

export default StatsSummaryCard
