import {
	Alert,
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
import type { NonEvaluableTarget } from "../../../../../services/gateService"

interface ApplyWarningDialogProps {
	warnings: NonEvaluableTarget[]
	loading?: boolean
	onResolve: (proceed: boolean) => void
}

/**
 * Aviso não-bloqueante (BE-18): amostras de destino sem os canais que os
 * gates referenciam. As cópias são criadas normalmente, mas ficam marcadas
 * como não-avaliáveis naquelas amostras — sem estatísticas.
 */
export default function ApplyWarningDialog({
	warnings,
	loading,
	onResolve,
}: ApplyWarningDialogProps) {
	return (
		<Dialog
			open={warnings.length > 0}
			onClose={() => onResolve(false)}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
		>
			<DialogTitle>Canais ausentes em algumas amostras</DialogTitle>
			<DialogContent>
				<Alert severity="warning" sx={{ mb: 1.5 }}>
					Os gates serão copiados, mas ficarão não-avaliáveis nessas amostras —
					a linhagem abaixo deles também não terá estatísticas lá.
				</Alert>
				<List dense>
					{warnings.map((w) => (
						<ListItem key={w.file_data_id}>
							<ListItemText
								primary={w.file_name ?? `arquivo ${w.file_data_id}`}
								secondary={
									<Typography component="span" variant="body2">
										Canais ausentes: {w.missing_channels.join(", ")}
									</Typography>
								}
							/>
						</ListItem>
					))}
				</List>
			</DialogContent>
			<DialogActions
				sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}
			>
				<Button onClick={() => onResolve(false)} fullWidth disabled={loading}>
					Cancelar
				</Button>
				<Button
					onClick={() => onResolve(true)}
					variant="contained"
					color="warning"
					fullWidth
					disabled={loading}
				>
					Aplicar mesmo assim
				</Button>
			</DialogActions>
		</Dialog>
	)
}
