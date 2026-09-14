import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material"
import { MdLink as LinkIcon, MdMoreVert as MoreVertIcon } from "react-icons/md"
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
	const metrics = gate.analysis_result?.analysis_result?.summary_metrics
	const authorLabel = gateAuthorLabel(gate)
	const authorName = gate.created_by_name?.trim() || null
	const hasActions =
		handlers.onApplyGate || handlers.onRenameGate || handlers.onDeleteGate
	return (
		<TreeNode
			depth={depth}
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
							{gate.copied_from_id && (
								<Tooltip
									title={`Copiado de gate #${gate.copied_from_id}`}
									arrow
								>
									<Box sx={{ display: "inline-flex", alignItems: "center" }}>
										<LinkIcon
											style={{ fontSize: 14, color: "rgba(0,120,255,0.7)" }}
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
						<IconButton
							size="small"
							onClick={(e) => {
								e.stopPropagation()
								handlers.onMenuOpen(e, gate)
							}}
							sx={{ p: 0.25, flexShrink: 0 }}
							title="Opções do gate"
						>
							<MoreVertIcon style={{ fontSize: 16 }} />
						</IconButton>
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
