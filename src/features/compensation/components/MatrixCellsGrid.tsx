import { Box, Typography } from "@mui/material"

interface MatrixCellsGridProps {
	channels: string[]
	/** Valores já formatados em % (string) — um por célula. */
	cells: string[][]
	/** true = inputs editáveis; false = células somente leitura. */
	editable?: boolean
	/** Chaves "i,j" com valor inválido (marca a célula em vermelho). */
	invalid?: ReadonlySet<string>
	/** Chaves "i,j" alteradas em relação à matriz de origem. */
	changed?: ReadonlySet<string>
	onCellChange?: (i: number, j: number, raw: string) => void
	/** Linha extra na legenda (ex.: aviso de células divergentes). */
	footerHint?: string
}

/**
 * Grade N×N de caixinhas da matriz de compensação — mesma linguagem
 * visual no painel (read-only) e no editor (inputs). Diagonal em
 * destaque; rolagem horizontal quando os canais estouram a largura.
 */
export default function MatrixCellsGrid({
	channels,
	cells,
	editable = false,
	invalid,
	changed,
	onCellChange,
	footerHint,
}: MatrixCellsGridProps) {
	return (
		<Box
			sx={(theme) => ({
				overflowX: "auto",
				border: 1,
				borderColor: "divider",
				borderRadius: 1,
				p: { xs: 1, sm: 1.5 },
				bgcolor: theme.palette.action.hover,
			})}
		>
			<Box
				component="table"
				sx={{
					borderCollapse: "separate",
					borderSpacing: 3,
					fontFamily: "monospace",
					fontSize: "0.75rem",
				}}
			>
				<thead>
					<tr>
						<Box component="th" />
						{channels.map((c) => (
							<Box
								component="th"
								key={c}
								sx={{
									writingMode: "vertical-rl",
									fontWeight: 600,
									fontSize: "0.7rem",
									textAlign: "left",
									color: "text.secondary",
									px: 0.5,
									pb: 0.5,
								}}
							>
								{c}
							</Box>
						))}
					</tr>
				</thead>
				<tbody>
					{cells.map((row, i) => (
						<tr key={channels[i] ?? i}>
							<Box
								component="td"
								sx={{
									fontWeight: 600,
									color: "text.secondary",
									pr: 1,
									whiteSpace: "nowrap",
								}}
							>
								{channels[i]}
							</Box>
							{row.map((raw, j) =>
								editable ? (
									<td key={j}>
										<Box
											component="input"
											value={raw}
											inputMode="decimal"
											aria-label={`${channels[i]} ← ${channels[j]}`}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												onCellChange?.(i, j, e.target.value)
											}
											sx={{
												width: "3.4rem",
												font: "inherit",
												textAlign: "right",
												p: "4px 6px",
												border: 1,
												borderRadius: 0.5,
												borderColor: invalid?.has(`${i},${j}`)
													? "error.main"
													: "divider",
												bgcolor: invalid?.has(`${i},${j}`)
													? "error.light"
													: changed?.has(`${i},${j}`)
														? "warning.light"
														: "background.paper",
												fontWeight: i === j ? 700 : 400,
												color: "text.primary",
												outline: "none",
												"&:focus": {
													borderColor: "primary.main",
												},
											}}
										/>
									</td>
								) : (
									<td key={j}>
										<Box
											sx={{
												width: "3.4rem",
												textAlign: "right",
												p: "4px 6px",
												border: 1,
												borderRadius: 0.5,
												borderColor: i === j ? "primary.main" : "divider",
												bgcolor: "background.paper",
												fontWeight: i === j ? 700 : 400,
												color: i === j ? "primary.main" : "text.primary",
											}}
										>
											{raw}
										</Box>
									</td>
								),
							)}
						</tr>
					))}
				</tbody>
			</Box>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ display: "block", mt: 1 }}
			>
				Valores em % — linha = canal detector, coluna = fluorócromo.
				{footerHint}
			</Typography>
		</Box>
	)
}
