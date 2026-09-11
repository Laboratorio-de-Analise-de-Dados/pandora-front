import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	List,
	ListItem,
	ListItemText,
	Typography,
} from "@mui/material"
import type { ApplyGateConflict } from "../../../services/gateService"

interface ApplyConflictDialogProps {
	conflicts: ApplyGateConflict[]
	loading?: boolean
	onResolve: (resolution: "replace" | "rename" | null) => void
}

/**
 * Mostra os gates de mesmo nome que já existem nos destinos e deixa o usuário
 * escolher entre sobrescrevê-los (mantendo os sub-gates existentes) ou criar
 * cópias com nome novo.
 */
export default function ApplyConflictDialog({
	conflicts,
	loading,
	onResolve,
}: ApplyConflictDialogProps) {
	return (
		<Dialog
			open={conflicts.length > 0}
			onClose={() => onResolve(null)}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Gates com o mesmo nome no destino</DialogTitle>
			<DialogContent>
				<Typography variant="body2">
					Sobrescrever mantém os sub-gates que já existem no destino e substitui
					apenas o desenho e a cor.
				</Typography>
				<List dense>
					{conflicts.map((conflict) => (
						<ListItem key={`${conflict.file_data_id}-${conflict.gate_id}`}>
							<ListItemText
								primary={conflict.name}
								secondary={conflict.file_name ?? `arquivo ${conflict.file_data_id}`}
							/>
						</ListItem>
					))}
				</List>
			</DialogContent>
			<DialogActions
				sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}
			>
				<Button onClick={() => onResolve(null)} fullWidth disabled={loading}>
					Cancelar
				</Button>
				<Button
					onClick={() => onResolve("rename")}
					fullWidth
					disabled={loading}
				>
					Manter os dois
				</Button>
				<Button
					onClick={() => onResolve("replace")}
					variant="contained"
					color="warning"
					fullWidth
					disabled={loading}
				>
					Sobrescrever ({conflicts.length})
				</Button>
			</DialogActions>
		</Dialog>
	)
}
