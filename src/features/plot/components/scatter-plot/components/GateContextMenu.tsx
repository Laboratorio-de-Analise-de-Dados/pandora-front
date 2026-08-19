import React from "react"
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material"
import {
	MdOpenWith as ReshapeIcon,
	MdPalette as PaletteIcon,
	MdEdit as EditIcon,
	MdDelete as DeleteIcon,
} from "react-icons/md"

interface GateContextMenuProps {
	anchorPosition: { top: number; left: number } | null
	onClose: () => void
	onReshape: () => void
	onColor: () => void
	onRename: () => void
	onDelete: () => void
}

const GateContextMenu: React.FC<GateContextMenuProps> = ({
	anchorPosition,
	onClose,
	onReshape,
	onColor,
	onRename,
	onDelete,
}) => (
	<Menu
		open={anchorPosition !== null}
		onClose={onClose}
		anchorReference="anchorPosition"
		anchorPosition={anchorPosition ?? undefined}
	>
		<MenuItem onClick={onReshape}>
			<ListItemIcon>
				<ReshapeIcon fontSize="small" />
			</ListItemIcon>
			<ListItemText>Redimensionar</ListItemText>
		</MenuItem>
		<MenuItem onClick={onColor}>
			<ListItemIcon>
				<PaletteIcon fontSize="small" />
			</ListItemIcon>
			<ListItemText>Trocar cor</ListItemText>
		</MenuItem>
		<MenuItem onClick={onRename}>
			<ListItemIcon>
				<EditIcon fontSize="small" />
			</ListItemIcon>
			<ListItemText>Renomear</ListItemText>
		</MenuItem>
		<MenuItem onClick={onDelete}>
			<ListItemIcon>
				<DeleteIcon fontSize="small" />
			</ListItemIcon>
			<ListItemText>Excluir</ListItemText>
		</MenuItem>
	</Menu>
)

export default GateContextMenu
