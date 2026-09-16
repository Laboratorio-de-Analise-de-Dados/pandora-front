import { Badge, IconButton, Tooltip } from "@mui/material"
import {
	MdOutlineBlurOn as CompensationIcon,
	MdBlurOn as CompensationAppliedIcon,
} from "react-icons/md"

interface CompensationIndicatorProps {
	/** Nome da matriz aplicada no experimento — null = dados crus. */
	appliedName: string | null
	/** A amostra atual traz $SPILLOVER/$COMP nos headers. */
	currentFileHasEmbedded: boolean
	/** Alguma amostra do experimento traz matriz embutida. */
	experimentHasEmbedded: boolean
	onClick: () => void
}

/**
 * Ícone de compensação no cluster de análise (FE-27). Três estados:
 * aplicada (preenchido, primário) → a amostra traz matriz embutida
 * (badge âmbar) → nenhuma informação (esmaecido). O tooltip sempre
 * explica o estado atual.
 */
export default function CompensationIndicator({
	appliedName,
	currentFileHasEmbedded,
	experimentHasEmbedded,
	onClick,
}: CompensationIndicatorProps) {
	const tooltip = appliedName
		? `Compensação aplicada: ${appliedName}`
		: currentFileHasEmbedded
			? "Esta amostra traz uma matriz de compensação — abrir para usar"
			: experimentHasEmbedded
				? "O experimento tem amostras com matriz embutida"
				: "Compensação — nenhuma matriz detectada"

	return (
		<Tooltip title={tooltip} arrow>
			<IconButton
				size="small"
				onClick={onClick}
				aria-label="Compensação"
				sx={{ p: 0.5 }}
				color={appliedName ? "primary" : "default"}
			>
				<Badge
					variant="dot"
					color="warning"
					invisible={appliedName != null || !currentFileHasEmbedded}
				>
					{appliedName ? (
						<CompensationAppliedIcon style={{ fontSize: 18 }} />
					) : (
						<CompensationIcon
							style={{
								fontSize: 18,
								opacity:
									currentFileHasEmbedded || experimentHasEmbedded ? 1 : 0.45,
							}}
						/>
					)}
				</Badge>
			</IconButton>
		</Tooltip>
	)
}
