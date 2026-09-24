import { Box, Typography } from "@mui/material"

/** Grade N×N da matriz — legível até ~12 canais; além disso vira scroll. */
export default function MatrixGrid({
	channels,
	matrix,
}: {
	channels: string[]
	matrix: number[][]
}) {
	return (
		<Box
			component="div"
			sx={(theme) => ({
				overflowX: "auto",
				fontSize: "0.65rem",
				fontFamily: "monospace",
				border: 1,
				borderColor: "divider",
				borderRadius: 1,
				p: 0.5,
				bgcolor: theme.palette.action.hover,
			})}
		>
			<table style={{ borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th />
						{channels.map((c) => (
							<th
								key={c}
								style={{
									padding: "1px 4px",
									writingMode: "vertical-rl",
									fontWeight: 600,
									textAlign: "left",
								}}
							>
								{c}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{matrix.map((row, i) => (
						<tr key={channels[i] ?? i}>
							<td style={{ fontWeight: 600, paddingRight: 4 }}>
								{channels[i]}
							</td>
							{row.map((v, j) => (
								<td
									key={j}
									style={{
										textAlign: "right",
										padding: "0 4px",
										fontWeight: i === j ? 700 : 400,
									}}
								>
									{(v * 100).toFixed(1)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
			<Typography variant="caption" color="text.secondary">
				Valores em % — linha = canal detector, coluna = fluorócromo.
			</Typography>
		</Box>
	)
}
