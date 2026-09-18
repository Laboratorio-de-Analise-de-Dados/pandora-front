import {
	Box,
	Checkbox,
	Chip,
	IconButton,
	Tooltip,
	Typography,
} from "@mui/material"
import {
	MdFolder as FolderIcon,
	MdMoreVert as MoreVertIcon,
} from "react-icons/md"
import type { SubsampleGroup } from "../../utils/groupBySubsample"
import TreeNode from "./TreeNode"
import FileTreeItem from "./FileTreeItem"
import type { TreeHandlers } from "./types"

/** Nível subsample: agrupador, não selecionável. */
export default function SubsampleGroupItem({
	group,
	handlers,
}: {
	group: SubsampleGroup
	handlers: TreeHandlers
}) {
	const name =
		group.subsample?.name ??
		(group.subsampleId !== null
			? `Subsample #${group.subsampleId}`
			: "Sem subsample")
	// Checkbox "selecionar grupo" — visível só no modo de seleção.
	const selectedCount = group.files.filter((f) =>
		handlers.selectedFileIds?.has(f.id),
	).length
	const allChecked =
		group.files.length > 0 && selectedCount === group.files.length
	return (
		<TreeNode
			depth={0}
			expandSignal={handlers.expandSignal}
			label={
				<Box
					sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
				>
					{handlers.onToggleGroup && (
						<Checkbox
							size="small"
							checked={allChecked}
							indeterminate={!allChecked && selectedCount > 0}
							onClick={(e) => e.stopPropagation()}
							onChange={(e) =>
								handlers.onToggleGroup?.(
									group.files.map((f) => f.id),
									e.target.checked,
								)
							}
							sx={{ p: 0.25 }}
						/>
					)}
					<FolderIcon style={{ fontSize: 15, flexShrink: 0, opacity: 0.7 }} />
					<Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }} noWrap>
						{name}
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontSize: "0.65rem", flexShrink: 0 }}
					>
						{group.files.length}{" "}
						{group.files.length === 1 ? "amostra" : "amostras"}
					</Typography>
					{group.subsample?.control_type && (
						<Tooltip title="Controle de compensação" arrow>
							<Chip
								label={
									group.subsample.control_type === "unstained"
										? "negativo"
										: `controle ${group.subsample.control_channel}`
								}
								size="small"
								color="warning"
								variant="outlined"
								sx={{ height: 16, fontSize: "0.6rem", flexShrink: 0 }}
							/>
						</Tooltip>
					)}
					{group.subsample && handlers.onSubsampleMenuOpen && (
						<Tooltip title="Opções do subsample" arrow placement="right">
							<IconButton
								size="small"
								onClick={(e) => {
									e.stopPropagation()
									handlers.onSubsampleMenuOpen?.(e, group.subsample!)
								}}
								sx={{ p: 0.25, flexShrink: 0, ml: "auto" }}
							>
								<MoreVertIcon style={{ fontSize: 16 }} />
							</IconButton>
						</Tooltip>
					)}
				</Box>
			}
		>
			{group.files.map((file) => (
				<FileTreeItem
					key={`file-${file.id}`}
					file={file}
					depth={1}
					handlers={handlers}
				/>
			))}
		</TreeNode>
	)
}
