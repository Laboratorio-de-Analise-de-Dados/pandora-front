import React from "react"
import { Button, Menu, MenuItem, Tooltip, Typography } from "@mui/material"
import {
	MdKeyboardArrowDown as ArrowDownIcon,
	MdChevronRight as ChevronIcon,
} from "react-icons/md"
import type { SelectedSource } from "../../../components/parent_tree"
import type { SelectableItem } from "../utils/selectable"

interface SourceSelectorProps {
	currentPath: string | null
	selectableItems: SelectableItem[]
	source: SelectedSource | undefined
	onSelect: (item: SelectableItem) => void
}

const SourceSelector: React.FC<SourceSelectorProps> = ({
	currentPath,
	selectableItems,
	source,
	onSelect,
}) => {
	const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)

	return (
		<>
			<Button
				size="small"
				variant="outlined"
				onClick={(e) => setAnchorEl(e.currentTarget)}
				endIcon={<ArrowDownIcon />}
				sx={{
					textTransform: "none",
					fontSize: "0.75rem",
					py: 0.25,
					px: 1,
					mb: 0.5,
					justifyContent: "space-between",
					width: "100%",
					overflow: "hidden",
				}}
			>
				<Typography
					variant="caption"
					noWrap
					sx={{ flex: 1, textAlign: "left", fontSize: "0.75rem" }}
				>
					{currentPath ?? "Selecionar..."}
				</Typography>
			</Button>
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={() => setAnchorEl(null)}
				slotProps={{
					paper: { sx: { maxHeight: 320, maxWidth: 340, minWidth: 220 } },
				}}
			>
				{selectableItems.map((item) => {
					const isSelected =
						source?.type === item.type && source?.id === item.id
					return (
						<Tooltip
							key={`${item.type}-${item.id}`}
							title={item.path}
							placement="right"
						>
							<MenuItem
								selected={isSelected}
								onClick={() => {
									onSelect(item)
									setAnchorEl(null)
								}}
								sx={{ py: 0.5, pl: 1.5 + item.depth * 2, minHeight: 0 }}
							>
								<Typography
									variant="caption"
									sx={{ fontSize: "0.75rem" }}
									noWrap
								>
									{item.depth > 0 && (
										<ChevronIcon
											style={{
												fontSize: 12,
												verticalAlign: "middle",
												marginRight: 2,
												opacity: 0.5,
											}}
										/>
									)}
									{item.type === "file" ? "📄 " : "🔲 "}
									{item.name}
								</Typography>
							</MenuItem>
						</Tooltip>
					)
				})}
				{selectableItems.length === 0 && (
					<MenuItem disabled>
						<Typography variant="caption" color="text.secondary">
							Nenhum arquivo carregado
						</Typography>
					</MenuItem>
				)}
			</Menu>
		</>
	)
}

export default SourceSelector
export type { SelectableItem } from "../utils/selectable"
