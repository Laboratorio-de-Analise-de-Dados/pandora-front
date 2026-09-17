import { Box, CircularProgress, Drawer } from "@mui/material"
import {
	ExperimentWorkspaceProvider,
	useExperimentWorkspace,
} from "../../experiment/context/ExperimentWorkspaceContext"
import HistoryPanel from "./HistoryPanel"

function PanelWithWorkspace({
	canEdit,
	onClose,
}: {
	canEdit: boolean
	onClose: () => void
}) {
	const { experiment, experimentFiles, isLoading } = useExperimentWorkspace()
	if (isLoading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100%",
				}}
			>
				<CircularProgress size={28} />
			</Box>
		)
	}
	return (
		<HistoryPanel
			experimentId={experiment?.id}
			files={experimentFiles}
			canEdit={canEdit}
			onClose={onClose}
		/>
	)
}

/**
 * Histórico no nível do experimento (FE-27): timeline completa, sem
 * recorte por amostra. Usado como ação do experimento fora do workspace
 * (ex.: menu do card na listagem) — por isso monta um provider próprio.
 */
export default function ExperimentHistoryDrawer({
	experimentId,
	canEdit,
	open,
	onClose,
}: {
	experimentId: number
	canEdit: boolean
	open: boolean
	onClose: () => void
}) {
	return (
		<Drawer
			anchor="right"
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: { width: "min(440px, 100vw)", display: "flex" },
			}}
		>
			{open && (
				<ExperimentWorkspaceProvider experimentId={String(experimentId)}>
					<PanelWithWorkspace canEdit={canEdit} onClose={onClose} />
				</ExperimentWorkspaceProvider>
			)}
		</Drawer>
	)
}
