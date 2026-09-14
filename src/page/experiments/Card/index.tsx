import { useState } from "react"
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	ListItemText,
	Menu,
	MenuItem,
	Typography,
} from "@mui/material"
import { toast } from "react-toastify"
import {
	MdInfoOutline as InfoIcon,
	MdMoreVert as MoreIcon,
} from "react-icons/md"
import { ExperimentComponent } from "./style"
import { Experiment } from "../../../types"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../providers/AuthContext"
import { useExperimentsContext } from "../../../providers/ExperimentContext"
import {
	restoreExperiment,
	updateExperiment,
} from "../../../services/experimentService"
import type { UpdateExperimentPayload } from "../../../services/experimentService"
import { extractErrorMessage } from "../../../utils/apiError"
import ExperimentContextDialog, {
	ContextDialogMode,
} from "../../../features/experiment/components/ExperimentContextDialog"
import EditExperimentDialog from "../../../features/experiment/components/EditExperimentDialog"
import ExperimentDetailsDialog from "../../../features/experiment/components/ExperimentDetailsDialog"

interface ExperimentCardProps {
	experiment: Experiment
	/** Refresh da listagem preservando o filtro atual (ex.: inativos visíveis). */
	onChanged?: () => void
}

export default function ExperimentCard({
	experiment,
	onChanged,
}: ExperimentCardProps) {
	const navigate = useNavigate()
	const { user } = useAuth()
	const { listExperiments } = useExperimentsContext()
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
	const [dialogMode, setDialogMode] = useState<ContextDialogMode | null>(null)
	const [restoreOpen, setRestoreOpen] = useState(false)
	const [restoring, setRestoring] = useState(false)
	const [detailsOpen, setDetailsOpen] = useState(false)
	const [editOpen, setEditOpen] = useState(false)
	const [savingExperiment, setSavingExperiment] = useState(false)
	const [editError, setEditError] = useState<string | null>(null)

	const refresh = onChanged ?? (() => listExperiments())
	const inactive = !experiment.active

	const handleClick = () => {
		if (inactive) {
			setRestoreOpen(true)
			return
		}
		navigate(`/experiments/${experiment.id}`)
	}

	// Mover exige dono/admin na origem (BE-11): dono, super admin ou
	// org_admin na organização atual do experimento.
	const canMove =
		user?.is_super_admin ||
		experiment.created_by === user?.id ||
		(experiment.organization != null &&
			user?.memberships?.some(
				(m) =>
					m.organization.id === experiment.organization?.id &&
					m.role === "org_admin",
			))

	// Espelha can_edit_experiment do backend: criador, super admin ou
	// membro ativo da organização do experimento.
	const canEdit =
		user?.is_super_admin ||
		experiment.created_by === user?.id ||
		(experiment.organization != null &&
			user?.memberships?.some(
				(m) => m.organization.id === experiment.organization?.id,
			))

	const openDialog = (mode: ContextDialogMode) => {
		setMenuAnchor(null)
		setDialogMode(mode)
	}

	const handleRestore = async () => {
		setRestoring(true)
		try {
			await restoreExperiment(experiment.id)
			toast.success("Experimento reativado.")
			setRestoreOpen(false)
			refresh()
		} catch (error) {
			toast.error(extractErrorMessage(error) || "Erro ao reativar.")
		} finally {
			setRestoring(false)
		}
	}

	const handleSaveExperiment = async (payload: UpdateExperimentPayload) => {
		setSavingExperiment(true)
		setEditError(null)
		try {
			await updateExperiment(experiment.id, payload)
			toast.success("Experimento atualizado!")
			setEditOpen(false)
			refresh()
		} catch (error) {
			setEditError(
				extractErrorMessage(error) || "Erro ao atualizar o experimento.",
			)
		} finally {
			setSavingExperiment(false)
		}
	}

	return (
		<>
			<ExperimentComponent $inactive={inactive} onClick={handleClick}>
				<IconButton
					size="small"
					aria-label="Detalhes do experimento"
					title="Detalhes do experimento"
					onClick={(e) => {
						e.stopPropagation()
						setDetailsOpen(true)
					}}
					sx={{ position: "absolute", top: 4, right: inactive ? 4 : 36 }}
				>
					<InfoIcon />
				</IconButton>
				{!inactive && (
					<IconButton
						size="small"
						aria-label="Ações do experimento"
						onClick={(e) => {
							e.stopPropagation()
							setMenuAnchor(e.currentTarget)
						}}
						sx={{ position: "absolute", top: 4, right: 4 }}
					>
						<MoreIcon />
					</IconButton>
				)}
				<h1>{experiment.title}</h1>
				<div>Type: {experiment.type}</div>
				{inactive && <div className="inactive-badge">Desativado</div>}
				<div className="card-footer">
					<span className="creator">{experiment.created_by_name ?? "—"}</span>
					<span className="org">
						{experiment.organization?.name ?? "Pessoal"}
					</span>
				</div>
			</ExperimentComponent>
			<Menu
				anchorEl={menuAnchor}
				open={menuAnchor != null}
				onClose={() => setMenuAnchor(null)}
				onClick={(e) => e.stopPropagation()}
			>
				<MenuItem onClick={() => openDialog("copy")}>
					<ListItemText>Copiar para…</ListItemText>
				</MenuItem>
				{canMove ? (
					<MenuItem onClick={() => openDialog("move")}>
						<ListItemText>Mover para…</ListItemText>
					</MenuItem>
				) : null}
				{canEdit ? (
					<MenuItem
						onClick={() => {
							setMenuAnchor(null)
							setEditError(null)
							setEditOpen(true)
						}}
					>
						<ListItemText>Editar</ListItemText>
					</MenuItem>
				) : null}
			</Menu>
			{dialogMode && (
				<ExperimentContextDialog
					open
					mode={dialogMode}
					experiment={experiment}
					onClose={() => setDialogMode(null)}
					onDone={refresh}
				/>
			)}
			<ExperimentDetailsDialog
				open={detailsOpen}
				experiment={experiment}
				onEdit={
					canEdit && !inactive
						? () => {
								setDetailsOpen(false)
								setEditError(null)
								setEditOpen(true)
							}
						: undefined
				}
				onClose={() => setDetailsOpen(false)}
			/>
			{editOpen && (
				<EditExperimentDialog
					open
					experiment={experiment}
					saving={savingExperiment}
					error={editError}
					onClose={() => setEditOpen(false)}
					onSave={handleSaveExperiment}
				/>
			)}
			<Dialog open={restoreOpen} onClose={() => setRestoreOpen(false)}>
				<DialogTitle>Experimento desativado</DialogTitle>
				<DialogContent>
					<Typography variant="body2">
						"{experiment.title}" está arquivado e não aparece nas listagens. Os
						dados, gates e subsamples foram preservados.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setRestoreOpen(false)}>Fechar</Button>
					<Button
						variant="contained"
						onClick={handleRestore}
						disabled={restoring}
					>
						{restoring ? "Reativando…" : "Reativar"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}
