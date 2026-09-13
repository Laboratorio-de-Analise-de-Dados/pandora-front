import { useState } from "react"
import { IconButton, ListItemText, Menu, MenuItem } from "@mui/material"
import { MdMoreVert as MoreIcon } from "react-icons/md"
import { ExperimentComponent } from "./style"
import { Experiment } from "../../../types"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../../providers/AuthContext"
import { useExperimentsContext } from "../../../providers/ExperimentContext"
import ExperimentContextDialog, {
	ContextDialogMode,
} from "../../../features/experiment/components/ExperimentContextDialog"

interface ExperimentCardProps {
	experiment: Experiment
}

export default function ExperimentCard({ experiment }: ExperimentCardProps) {
	const navigate = useNavigate()
	const { user } = useAuth()
	const { listExperiments } = useExperimentsContext()
	const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
	const [dialogMode, setDialogMode] = useState<ContextDialogMode | null>(null)

	const redirectPage = () => {
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

	const openDialog = (mode: ContextDialogMode) => {
		setMenuAnchor(null)
		setDialogMode(mode)
	}

	return (
		<>
			<ExperimentComponent onClick={redirectPage}>
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
				<h1>{experiment.title}</h1>
				<div>Type: {experiment.type}</div>
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
			</Menu>
			{dialogMode && (
				<ExperimentContextDialog
					open
					mode={dialogMode}
					experiment={experiment}
					onClose={() => setDialogMode(null)}
					onDone={listExperiments}
				/>
			)}
		</>
	)
}
