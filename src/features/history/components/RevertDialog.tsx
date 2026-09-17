import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	List,
	ListItem,
	ListItemText,
	Typography,
} from "@mui/material"
import type {
	HistoryConflict,
	RevertPlan,
} from "../../../services/historyService"
import { describeChange, describeConflict } from "../utils/describe"

interface RevertDialogProps {
	open: boolean
	revisionSummary: string
	/** Plano do dry-run; `null` enquanto carrega. */
	plan: RevertPlan | null
	/** Conflitos retornados pelo dry-run ou pelo 409 da confirmação. */
	conflicts: HistoryConflict[]
	loading: boolean
	onConfirm: () => void
	onClose: () => void
}

/**
 * Revert unitário (BE-08): dry-run mostra `would_change`; conflitos
 * bloqueiam sem opção de força (decisão do backend — o restore por ponto
 * é quem tem "Sobrescrever alterações").
 */
export default function RevertDialog({
	open,
	revisionSummary,
	plan,
	conflicts,
	loading,
	onConfirm,
	onClose,
}: RevertDialogProps) {
	const blocked = conflicts.length > 0
	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Reverter esta ação</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 1 }}>
					{revisionSummary}
				</Typography>
				{!plan ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
						<CircularProgress size={28} />
					</Box>
				) : (
					<>
						{plan.would_change.length === 0 && !blocked && (
							<Alert severity="info">
								Esta revisão não tem efeito reversível a aplicar.
							</Alert>
						)}
						{plan.would_change.length > 0 && (
							<List dense>
								{plan.would_change.map((change, index) => (
									<ListItem key={index} sx={{ py: 0.25 }}>
										<ListItemText
											primary={describeChange(change)}
											primaryTypographyProps={{
												variant: "body2",
											}}
										/>
									</ListItem>
								))}
							</List>
						)}
						{blocked && (
							<>
								<Alert severity="error" sx={{ mt: 1 }}>
									Não é possível reverter: o estado atual conflita com o ponto
									desta revisão.
								</Alert>
								<List dense>
									{conflicts.map((conflict, index) => (
										<ListItem key={index} sx={{ py: 0.25 }}>
											<ListItemText
												primary={describeConflict(conflict)}
												primaryTypographyProps={{
													variant: "body2",
												}}
											/>
										</ListItem>
									))}
								</List>
							</>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions
				sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}
			>
				<Button onClick={onClose} fullWidth disabled={loading}>
					{blocked ? "Fechar" : "Cancelar"}
				</Button>
				{!blocked && (
					<Button
						variant="contained"
						fullWidth
						disabled={loading || !plan || plan.would_change.length === 0}
						onClick={onConfirm}
					>
						{loading ? <CircularProgress size={20} /> : "Reverter"}
					</Button>
				)}
			</DialogActions>
		</Dialog>
	)
}
