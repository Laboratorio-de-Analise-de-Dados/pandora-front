import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
	Box,
	Chip,
	Collapse,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdExpandMore as ExpandIcon,
	MdPushPin as PinIcon,
	MdSettingsBackupRestore as RestoreIcon,
	MdVisibility as PreviewIcon,
	MdUndo as RevertIcon,
} from "react-icons/md"
import { fetchRevisionDetail } from "../../../services/historyService"
import type {
	AnalysisCheckpoint,
	AnalysisRevision,
} from "../../../services/historyService"
import { checkpointLabel, formatTime } from "../utils/datetime"

interface RevisionRowProps {
	revision: AnalysisRevision
	/** Checkpoint fixado exatamente nesta revisão, se houver. */
	checkpoint?: AnalysisCheckpoint
	canEdit: boolean
	onPin: (revisionId: number) => void
	onRevert: (revision: AnalysisRevision) => void
	onRestoreHere: (revision: AnalysisRevision) => void
	onPreview: (revision: AnalysisRevision) => void
}

/**
 * Linha da timeline: horário, summary pronto, autor. Expande para o
 * before/after do detalhe (`GET /history/<id>/`, busca lazy). Ações:
 * pin (fixar checkpoint), reverter, restaurar até aqui, visualizar.
 */
export default function RevisionRow({
	revision,
	checkpoint,
	canEdit,
	onPin,
	onRevert,
	onRestoreHere,
	onPreview,
}: RevisionRowProps) {
	const [expanded, setExpanded] = useState(false)
	const { data: detail } = useQuery({
		queryKey: ["revision-detail", revision.id],
		queryFn: () => fetchRevisionDetail(revision.id),
		enabled: expanded,
	})

	return (
		<Box
			sx={{
				py: 0.75,
				px: 1,
				borderLeft: (theme) =>
					checkpoint
						? `3px solid ${theme.palette.primary.main}`
						: "3px solid transparent",
			}}
		>
			<Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ minWidth: 38, mt: 0.25 }}
				>
					{formatTime(revision.created_at)}
				</Typography>
				<Box sx={{ flex: 1, minWidth: 0 }}>
					<Typography variant="body2">{revision.summary}</Typography>
					{revision.author && (
						<Typography variant="caption" color="text.secondary">
							por {revision.author}
						</Typography>
					)}
					{checkpoint && (
						<Box sx={{ mt: 0.5 }}>
							<Chip
								icon={<PinIcon />}
								size="small"
								color="primary"
								variant="outlined"
								label={checkpointLabel(
									checkpoint.message,
									checkpoint.created_at,
								)}
							/>
						</Box>
					)}
				</Box>
				<Box sx={{ display: "flex", flexShrink: 0 }}>
					<Tooltip title="Detalhes (antes/depois)">
						<IconButton
							size="small"
							onClick={() => setExpanded((v) => !v)}
							sx={{
								transform: expanded ? "rotate(180deg)" : "none",
							}}
						>
							<ExpandIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					<Tooltip title="Visualizar estado neste ponto">
						<IconButton size="small" onClick={() => onPreview(revision)}>
							<PreviewIcon fontSize="small" />
						</IconButton>
					</Tooltip>
					{canEdit && (
						<>
							{!checkpoint && (
								<Tooltip title="Fixar checkpoint aqui">
									<IconButton size="small" onClick={() => onPin(revision.id)}>
										<PinIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
							{revision.revertible && (
								<Tooltip title="Reverter esta ação">
									<IconButton size="small" onClick={() => onRevert(revision)}>
										<RevertIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
							<Tooltip title="Restaurar até esta revisão">
								<IconButton
									size="small"
									onClick={() => onRestoreHere(revision)}
								>
									<RestoreIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</>
					)}
				</Box>
			</Box>
			<Collapse in={expanded}>
				<Box
					component="pre"
					sx={(theme) => ({
						ml: "38px",
						mt: 0.5,
						p: 1,
						fontSize: "0.7rem",
						bgcolor: theme.palette.action.hover,
						borderRadius: 1,
						overflowX: "auto",
						whiteSpace: "pre-wrap",
						wordBreak: "break-word",
					})}
				>
					{detail
						? JSON.stringify(
								{
									antes: detail.payload_before,
									depois: detail.payload_after,
								},
								null,
								1,
							)
						: "Carregando…"}
				</Box>
			</Collapse>
		</Box>
	)
}
