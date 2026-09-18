import { Chip, Tooltip } from "@mui/material"
import type { SampleTag } from "../../../types"
import { tagInitials } from "../utils/tagInitials"

/**
 * Chip de tag de amostra (BE-34). Próprias são preenchidas com a cor da
 * tag; herdadas do subsample são contornadas — distinção visual do PRD.
 * `compact` (árvore) mostra só as iniciais, nome completo no tooltip.
 */
export default function TagChip({
	tag,
	inherited = false,
	compact = false,
	onClick,
}: {
	tag: SampleTag
	inherited?: boolean
	/** Iniciais em vez do nome — pra linha da árvore. */
	compact?: boolean
	onClick?: () => void
}) {
	const chip = (
		<Chip
			label={compact ? tagInitials(tag.name) : tag.name}
			size="small"
			variant={inherited ? "outlined" : "filled"}
			onClick={onClick}
			sx={{
				height: 16,
				fontSize: "0.6rem",
				flexShrink: 0,
				"& .MuiChip-label": { px: compact ? 0.5 : 1 },
				...(inherited
					? { borderColor: tag.color, color: tag.color }
					: { bgcolor: tag.color, color: "#fff" }),
			}}
		/>
	)
	return compact || inherited ? (
		<Tooltip
			title={inherited ? `${tag.name} — herdada do subsample` : tag.name}
			arrow
		>
			{chip}
		</Tooltip>
	) : (
		chip
	)
}
