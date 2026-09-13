import React from "react"
import { Box, Typography } from "@mui/material"
import type { SummaryMetrics } from "../../../types"
import { fmtPct } from "../../../utils/format"

interface StatsSummaryCardProps {
	summary: SummaryMetrics
}

const StatsSummaryCard: React.FC<StatsSummaryCardProps> = ({ summary }) => (
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
)

export default StatsSummaryCard
