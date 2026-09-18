import {
	Box,
	Checkbox,
	Chip,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdInfoOutline as InfoIcon,
	MdMoreVert as MoreVertIcon,
	MdOutlineBlurOn as CompensationIcon,
} from "react-icons/md"
import type { ExperimentFiles } from "../../../../types"
import TagChip from "../../../tags/components/TagChip"
import TreeNode from "./TreeNode"
import GateTreeItem from "./GateTreeItem"
import type { TreeHandlers } from "./types"

/** Uma amostra e seus gates. No modo de seleção a linha marca/desmarca. */
export default function FileTreeItem({
	file,
	depth,
	handlers,
}: {
	file: ExperimentFiles
	depth: number
	handlers: TreeHandlers
}) {
	const inactive = file.active === false
	const canManage = handlers.onDisableFile || handlers.onEnableFile
	const selecting = !!handlers.onToggleFile
	const sel = handlers.selectedSource
	const selected =
		sel?.type === "file"
			? sel.id === file.id
			: sel?.type === "gate" && sel.fileDataId === file.id
	return (
		<TreeNode
			depth={depth}
			inactive={inactive}
			selected={!selecting && selected}
			expandSignal={handlers.expandSignal}
			onSelect={
				selecting
					? () => handlers.onToggleFile?.(file.id)
					: inactive
						? undefined
						: () =>
								handlers.onSelect({
									type: "file",
									id: file.id,
									name: file.file_name,
									fileDataId: file.id,
								})
			}
			label={
				<Box
					sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
				>
					{handlers.onToggleFile && (
						<Checkbox
							size="small"
							checked={handlers.selectedFileIds?.has(file.id) ?? false}
							onClick={(e) => e.stopPropagation()}
							onChange={() => handlers.onToggleFile?.(file.id)}
							sx={{ p: 0.25 }}
						/>
					)}
					<Typography
						sx={{ fontSize: "0.8rem", opacity: inactive ? 0.5 : 1 }}
						noWrap
					>
						📄{file.file_name}
					</Typography>
					{file.has_embedded_compensation && (
						<Tooltip
							title="Traz matriz de compensação ($SPILLOVER) nos headers"
							arrow
						>
							<CompensationIcon
								style={{ fontSize: 13, flexShrink: 0, opacity: 0.7 }}
								color="orange"
							/>
						</Tooltip>
					)}
					{inactive && (
						<Chip
							label="Desabilitada"
							size="small"
							sx={{ height: 16, fontSize: "0.6rem", flexShrink: 0 }}
						/>
					)}
					{(file.tags ?? []).map((tag) => (
						<TagChip key={`tag-${tag.id}`} tag={tag} />
					))}
					{(file.inherited_tags ?? []).map((tag) => (
						<TagChip key={`inh-${tag.id}`} tag={tag} inherited />
					))}
					<Box sx={{ ml: "auto", display: "flex", flexShrink: 0 }}>
						{handlers.onFileInfo && (
							<Tooltip title="Metadados do arquivo" arrow placement="right">
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation()
										handlers.onFileInfo?.(file)
									}}
									sx={{ p: 0.25 }}
								>
									<InfoIcon style={{ fontSize: 15, opacity: 0.6 }} />
								</IconButton>
							</Tooltip>
						)}
						{canManage && (
							<Tooltip title="Opções da amostra" arrow placement="right">
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation()
										handlers.onFileMenuOpen(e, file)
									}}
									sx={{ p: 0.25 }}
								>
									<MoreVertIcon style={{ fontSize: 16 }} />
								</IconButton>
							</Tooltip>
						)}
					</Box>
				</Box>
			}
		>
			{file.gates.map((gate, idx) => (
				<GateTreeItem
					key={`gate-${gate.id}`}
					gate={gate}
					fileDataId={file.id}
					depth={depth + 1}
					gateIndex={idx}
					handlers={handlers}
				/>
			))}
		</TreeNode>
	)
}
