import {
	Alert,
	Box,
	CircularProgress,
	Divider,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdCheck as AcceptIcon,
	MdClose as DiscardIcon,
	MdEdit as EditIcon,
} from "react-icons/md"
import type { ContextSuggestion } from "../utils/contextFilter"
import { fmtPct } from "../../../utils/format"

export interface PendingSuggestionsCardProps {
	suggestions: ContextSuggestion[]
	/** True enquanto um run do contexto está pending/processing. */
	analyzing: boolean
	/** Último run concluído sem candidatas — feedback honesto do §6. */
	emptyRunDetail?: string | null
	working?: boolean
	onAccept: (s: ContextSuggestion) => void
	onEdit: (s: ContextSuggestion) => void
	onDiscard: (s: ContextSuggestion) => void
}

/**
 * FE-42 §4/§5 — revisão das candidatas: propostas do Juvia com stats,
 * aceitar/editar/descartar. "Nada vira gate até você aceitar" — mesmo
 * espírito do aviso âmbar do rascunho de compensação.
 */
export default function PendingSuggestionsCard({
	suggestions,
	analyzing,
	emptyRunDetail,
	working,
	onAccept,
	onEdit,
	onDiscard,
}: PendingSuggestionsCardProps) {
	if (!analyzing && suggestions.length === 0 && !emptyRunDetail) return null

	return (
		<Box
			sx={(theme) => ({
				position: "absolute",
				top: 8,
				left: 8,
				zIndex: 5,
				width: 240,
				borderRadius: 1,
				border: `1px dashed ${theme.palette.warning.main}`,
				bgcolor: "background.paper",
				boxShadow: 3,
				p: 1,
				display: "flex",
				flexDirection: "column",
				gap: 0.5,
			})}
		>
			<Typography
				variant="caption"
				fontWeight="bold"
				color="warning.dark"
				sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
			>
				Sugestões — revise antes de virar gate
			</Typography>

			{analyzing && (
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
					<CircularProgress size={14} />
					<Typography variant="caption" color="text.secondary">
						Analisando populações…
					</Typography>
				</Box>
			)}

			{!analyzing && suggestions.length === 0 && emptyRunDetail && (
				<Alert severity="info" sx={{ py: 0, fontSize: "0.75rem" }}>
					{emptyRunDetail}
				</Alert>
			)}

			{suggestions.map((s, i) => (
				<Box key={s.suggestion.id}>
					{i > 0 && <Divider sx={{ my: 0.5 }} />}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 0.5,
						}}
					>
						<Box sx={{ flex: 1, minWidth: 0 }}>
							<Typography variant="caption" fontWeight="bold" noWrap>
								Sugestão {i + 1}
							</Typography>
							{(s.suggestion.stats?.pct_parent != null ||
								s.suggestion.stats?.events != null) && (
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ display: "block", fontSize: "0.65rem" }}
								>
									{s.suggestion.stats?.events != null &&
										`${s.suggestion.stats.events.toLocaleString()} events`}
									{s.suggestion.stats?.pct_parent != null &&
										` · %P ${fmtPct(s.suggestion.stats.pct_parent)}`}
								</Typography>
							)}
						</Box>
						<Tooltip title="Aceitar — vira gate na árvore" arrow>
							<span>
								<IconButton
									size="small"
									color="success"
									disabled={working}
									onClick={() => onAccept(s)}
									sx={{ p: 0.25 }}
								>
									<AcceptIcon style={{ fontSize: 16 }} />
								</IconButton>
							</span>
						</Tooltip>
						<Tooltip
							title="Editar e aceitar — ajusta a geometria antes de virar gate"
							arrow
						>
							<span>
								<IconButton
									size="small"
									disabled={working}
									onClick={() => onEdit(s)}
									sx={{ p: 0.25 }}
								>
									<EditIcon style={{ fontSize: 15 }} />
								</IconButton>
							</span>
						</Tooltip>
						<Tooltip title="Descartar sugestão" arrow>
							<span>
								<IconButton
									size="small"
									color="error"
									disabled={working}
									onClick={() => onDiscard(s)}
									sx={{ p: 0.25 }}
								>
									<DiscardIcon style={{ fontSize: 15 }} />
								</IconButton>
							</span>
						</Tooltip>
					</Box>
				</Box>
			))}
		</Box>
	)
}
