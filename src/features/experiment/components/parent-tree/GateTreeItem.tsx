import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material"
import {
	MdLink as LinkIcon,
	MdMoreVert as MoreVertIcon,
	MdWarningAmber as WarningIcon,
} from "react-icons/md"
import type { Gate } from "../../../../types"
import { getGateColor } from "../../../../constants/gateColors"
import { gateAxesLabel, gateAuthorLabel } from "../../../gate/utils"
import { fmtPct } from "../../../../utils/format"
import TreeNode from "./TreeNode"
import type { TreeHandlers } from "./types"

/** Um gate e seus sub-gates, recursivamente. */
export default function GateTreeItem({
	gate,
	fileDataId,
	depth,
	gateIndex,
	handlers,
}: {
	gate: Gate
	fileDataId: number
	depth: number
	gateIndex: number
	handlers: TreeHandlers
}) {
	const analysis = gate.analysis_result?.analysis_result
	const metrics = analysis?.summary_metrics
	// BE-18/ADR-0016: gate não-avaliável nesta amostra (canal ausente) — ou
	// bloqueado diretamente, ou cortado por um ancestral.
	const notEvaluable = analysis?.applicable === false
	const blockedBy = analysis?.blocked_by_gate
	const missingList = analysis?.missing_channels?.join(", ")
	const warningTip =
		blockedBy && blockedBy.id !== gate.id
			? `Não avaliável nesta amostra: o gate "${blockedBy.name}" usa canal(is) ausente(s) (${missingList}).`
			: `Não avaliável nesta amostra: canal(is) ausente(s) (${missingList}).`
	const authorLabel = gateAuthorLabel(gate)
	const authorName = gate.created_by_name?.trim() || null
	const hasActions =
		handlers.onApplyGate || handlers.onEditGate || handlers.onDeleteGate
	const selected =
		handlers.selectedSource?.type === "gate" &&
		handlers.selectedSource.id === gate.id
	return (
		<TreeNode
			depth={depth}
			selected={selected}
			onSelect={() =>
				handlers.onSelect({
					type: "gate",
					id: gate.id,
					name: gate.name,
					fileDataId,
					copiedFromId: gate.copied_from_id,
				})
			}
			label={
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						width: "100%",
					}}
					onContextMenu={(e) => {
						e.preventDefault()
						e.stopPropagation()
						handlers.onContextMenu(e, gate)
					}}
				>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							minWidth: 0,
							flex: 1,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Box
								component="span"
								sx={{
									display: "inline-block",
									width: 10,
									height: 10,
									borderRadius: "2px",
									backgroundColor: getGateColor(gate.color, gateIndex),
									flexShrink: 0,
								}}
							/>
							{authorName ? (
								<Tooltip title={authorLabel} arrow placement="top-start">
									<span style={{ fontSize: "0.85rem" }}>{gate.name}</span>
								</Tooltip>
							) : (
								<span style={{ fontSize: "0.85rem" }}>{gate.name}</span>
							)}
							{authorName && (
								<Chip
									label={authorName.split(" ")[0]}
									size="small"
									variant="outlined"
									sx={{
										height: 16,
										fontSize: "0.6rem",
										flexShrink: 0,
										"& .MuiChip-label": { px: 0.5 },
									}}
								/>
							)}
							{notEvaluable && (
								<Tooltip title={warningTip} arrow>
									<Box sx={{ display: "inline-flex", alignItems: "center" }}>
										<WarningIcon
											style={{
												fontSize: 15,
												color: "var(--mui-palette-warning-main, #FBBF24)",
											}}
										/>
									</Box>
								</Tooltip>
							)}
							{gate.copied_from_id && (
								<Tooltip
									title={`Copiado de gate #${gate.copied_from_id}`}
									arrow
								>
									<Box sx={{ display: "inline-flex", alignItems: "center" }}>
										<LinkIcon
											style={{
												fontSize: 14,
												color: "var(--mui-palette-info-main, #34D399)",
											}}
										/>
									</Box>
								</Tooltip>
							)}
						</Box>
						{gateAxesLabel(gate.gate_coordinates) && (
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									pl: 2.5,
									lineHeight: 1.1,
									fontStyle: "italic",
								}}
							>
								{gateAxesLabel(gate.gate_coordinates)}
							</Typography>
						)}
						{metrics && (
							<Typography
								variant="caption"
								sx={{
									color: "text.secondary",
									fontSize: "0.65rem",
									pl: 2.5,
									lineHeight: 1.2,
								}}
							>
								{metrics.count.toLocaleString()} events
								{" | "}
								%P {fmtPct(metrics.percent_of_parent_population)}
								{" | "}
								%T {fmtPct(metrics.percent_of_total_population)}
							</Typography>
						)}
					</Box>
					{hasActions && (
						<Tooltip title="Opções do gate" arrow>
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation()
									handlers.onMenuOpen(e, gate)
								}}
								sx={{ p: 0.25, flexShrink: 0 }}
							>
								<MoreVertIcon style={{ fontSize: 16 }} />
							</IconButton>
						</Tooltip>
					)}
				</Box>
			}
		>
			{gate.children?.map((childGate, childIdx) => (
				<GateTreeItem
					key={`gate-${childGate.id}`}
					gate={childGate}
					fileDataId={fileDataId}
					depth={depth + 1}
					gateIndex={childIdx}
					handlers={handlers}
				/>
			))}
		</TreeNode>
	)
}
