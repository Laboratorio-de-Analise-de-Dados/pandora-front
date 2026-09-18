import { Chip, Tooltip } from "@mui/material"
import type { SampleTag } from "../../../types"

/**
 * Chip de tag de amostra (BE-34). Próprias são preenchidas com a cor da
 * tag; herdadas do subsample são contornadas com tooltip explicando a
 * origem — é a distinção visual do PRD para citometristas.
 */
export default function TagChip({
	tag,
	inherited = false,
	onClick,
}: {
	tag: SampleTag
	inherited?: boolean
	onClick?: () => void
}) {
	const chip = (
		<Chip
			label={tag.name}
			size="small"
			variant={inherited ? "outlined" : "filled"}
			onClick={onClick}
			sx={{
				height: 16,
				fontSize: "0.6rem",
				flexShrink: 0,
				...(inherited
					? { borderColor: tag.color, color: tag.color }
					: { bgcolor: tag.color, color: "#fff" }),
			}}
		/>
	)
	return inherited ? (
		<Tooltip title="Herdada do subsample" arrow>
			{chip}
		</Tooltip>
	) : (
		chip
	)
}
