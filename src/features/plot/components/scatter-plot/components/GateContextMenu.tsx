import React from "react"
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material"
import {
	MdOpenWith as ReshapeIcon,
	MdEdit as EditIcon,
	MdDelete as DeleteIcon,
} from "react-icons/md"

interface GateContextMenuProps {
	anchorPosition: { top: number; left: number } | null
	onClose: () => void
	onReshape: () => void
	onEdit: () => void
	onDelete: () => void
}

const GateContextMenu: React.FC<GateContextMenuProps> = ({
	anchorPosition,
	onClose,
	onReshape,
	onEdit,
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
		<MenuItem onClick={onEdit}>
			<ListItemIcon>
				<EditIcon fontSize="small" />
			</ListItemIcon>
			<ListItemText>Editar gate</ListItemText>
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
