import { useState } from "react"
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	List,
	ListItem,
	ListItemText,
	Typography,
} from "@mui/material"
import type {
	HistoryConflict,
	RestorePlan,
} from "../../../services/historyService"
import { describeConflict, describePlanEntry } from "../utils/describe"

interface RestoreDialogProps {
	open: boolean
	/** Rótulo do ponto de destino ("checkpoint X", "revisão #42"). */
	targetLabel: string
	/** Plano do dry-run; `null` enquanto carrega. */
	plan: RestorePlan | null
	/** Conflitos do dry-run ou do 409 — presença habilita o modo force. */
	conflicts: HistoryConflict[]
	loading: boolean
	/** Resumo das revisões (para nomear cada entrada do plano). */
	summaryByRevision: Map<number, string>
	onConfirm: (force: boolean) => void
	onClose: () => void
}

/**
 * Fluxo unificado de restore (FE-25): dry-run lista o que será desfeito;
 * conflito exige a escolha explícita "Sobrescrever alterações" — nunca
 * força silenciosa.
 */
export default function RestoreDialog({
	open,
	targetLabel,
	plan,
	conflicts,
	loading,
	summaryByRevision,
	onConfirm,
	onClose,
}: RestoreDialogProps) {
	const hasConflicts = conflicts.length > 0
	const [forceChecked, setForceChecked] = useState(false)

	// Reseta a confirmação destrutiva sempre que o plano muda.
	const planKey = plan ? plan.would_change.length : -1
	const [lastPlanKey, setLastPlanKey] = useState(planKey)
	if (planKey !== lastPlanKey) {
		setLastPlanKey(planKey)
		setForceChecked(false)
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Restaurar até {targetLabel}</DialogTitle>
			<DialogContent>
				{!plan ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
						<CircularProgress size={28} />
					</Box>
				) : (
					<>
						{plan.would_change.length === 0 && !hasConflicts && (
							<Alert severity="info" sx={{ mb: 2 }}>
								Nenhuma alteração posterior a este ponto — o experimento já está
								no estado dele.
							</Alert>
						)}
						{plan.would_change.length > 0 && (
							<>
								<Typography variant="body2" sx={{ mb: 1 }}>
									As revisões abaixo serão desfeitas, da mais recente para a
									mais antiga:
								</Typography>
								<List dense>
									{plan.would_change.map((entry) => {
										const described = describePlanEntry(
											entry,
											summaryByRevision,
										)
										return (
											<ListItem
												key={entry.revision_id}
												sx={{ display: "block", py: 0.5 }}
											>
												<ListItemText
													primary={described.title}
													primaryTypographyProps={{
														variant: "body2",
														fontWeight: 600,
													}}
													secondary={described.items.join(" · ")}
												/>
											</ListItem>
										)
									})}
								</List>
							</>
						)}
						{hasConflicts && (
							<>
								<Alert severity="warning" sx={{ mt: 1 }}>
									{conflicts.length} conflito(s) — o estado atual divergiu do
									ponto. Para restaurar mesmo assim, confirme abaixo: as
									alterações conflitantes serão sobrescritas.
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
								<FormControlLabel
									control={
										<Checkbox
											checked={forceChecked}
											onChange={(e) => setForceChecked(e.target.checked)}
										/>
									}
									label={
										<Typography variant="body2">
											Sobrescrever alterações — estou ciente de que os conflitos
											acima serão perdidos
										</Typography>
									}
								/>
							</>
						)}
					</>
				)}
			</DialogContent>
			<DialogActions
				sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}
			>
				<Button onClick={onClose} fullWidth disabled={loading}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					color={hasConflicts ? "warning" : "primary"}
					fullWidth
					disabled={
						loading ||
						!plan ||
						(plan.would_change.length === 0 && !hasConflicts) ||
						(hasConflicts && !forceChecked)
					}
					onClick={() => onConfirm(hasConflicts)}
				>
					{loading ? (
						<CircularProgress size={20} />
					) : hasConflicts ? (
						"Sobrescrever e restaurar"
					) : (
						"Restaurar"
					)}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
