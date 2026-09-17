import { Box, CircularProgress, Stack, Typography } from "@mui/material"
import type { ApplyGatesResult } from "../../../../../services/gateService"

interface DryRunSummaryProps {
	preview: ApplyGatesResult | undefined
	targetCount: number
	loading: boolean
}

/**
 * Caixa de dry-run do diálogo de propagação: quantas amostras estão prontas,
 * quais ficam sem canal (aviso não-bloqueante, BE-18) e quais têm gates de
 * mesmo nome que seriam sobrescritos.
 */
export default function DryRunSummary({
	preview,
	targetCount,
	loading,
}: DryRunSummaryProps) {
	const warningFiles = new Set(
		preview?.non_evaluable?.map((n) => n.file_data_id) ?? [],
	)
	const conflictFiles = new Set(
		preview?.conflicts.map((c) => c.file_data_id) ?? [],
	)
	const ready = targetCount - new Set([...warningFiles, ...conflictFiles]).size

	return (
		<Box
			sx={{
				mt: 2,
				p: 2,
				borderRadius: 3,
				border: 1,
				borderColor: "divider",
				bgcolor: "background.default",
			}}
		>
			<Typography
				variant="caption"
				sx={{
					display: "block",
					color: "text.secondary",
					textTransform: "uppercase",
					letterSpacing: 0.5,
					mb: 1,
				}}
			>
				Dry-run — o que vai acontecer
			</Typography>
			{loading && !preview ? (
				<Stack direction="row" spacing={1} alignItems="center">
					<CircularProgress size={14} />
					<Typography variant="body2" color="text.secondary">
						Analisando amostras…
					</Typography>
				</Stack>
			) : (
				<Stack spacing={0.75}>
					<Typography variant="body2" sx={{ color: "primary.main" }}>
						● {ready} amostra{ready !== 1 ? "s" : ""} pronta
						{ready !== 1 ? "s" : ""}
					</Typography>
					{preview?.non_evaluable?.map((target) => (
						<Typography
							key={target.file_data_id}
							variant="body2"
							sx={{ color: "warning.main" }}
						>
							▲ {target.file_name}: sem canal{" "}
							{target.missing_channels.join(", ")} — o gate ficará marcado como
							não-avaliável
						</Typography>
					))}
					{conflictFiles.size > 0 && (
						<>
							<Typography variant="body2" sx={{ color: "error.main" }}>
								■ {conflictFiles.size} amostra
								{conflictFiles.size !== 1 ? "s" : ""} com gate de mesmo nome
							</Typography>
							<Typography variant="caption" sx={{ color: "text.secondary" }}>
								Sobrescrever mantém os sub-gates do destino e substitui desenho
								e cor; “Manter os dois” cria cópias renomeadas.
							</Typography>
						</>
					)}
				</Stack>
			)}
		</Box>
	)
}
