import { Box, Button } from "@mui/material"
import { AppDialog } from "../../../components/AppDialog"
import MatrixCellsGrid from "./MatrixCellsGrid"
import { formatPercentCell } from "../utils/matrixEdit"

interface ViewCompensationDialogProps {
	open: boolean
	onClose: () => void
	title: string
	channels: string[]
	matrix: number[][]
	/**
	 * Entra no modo de edição do workspace (FE-41): o painel direito vira
	 * o editor e o plot central mostra a prévia. Ausente = só leitura
	 * (matriz embutida ou usuário sem escrita).
	 */
	onEdit?: () => void
}

/**
 * Visualizador de matriz salva/embutida — grade read-only. A edição
 * mora no painel do workspace, não mais num dialog (FE-41 redesenhado).
 */
export default function ViewCompensationDialog({
	open,
	onClose,
	title,
	channels,
	matrix,
	onEdit,
}: ViewCompensationDialogProps) {
	return (
		<AppDialog
			open={open}
			title={title}
			onClose={onClose}
			maxWidth="sm"
			actions={
				<>
					<Button onClick={onClose}>Fechar</Button>
					{onEdit && (
						<Button variant="contained" onClick={onEdit}>
							Editar
						</Button>
					)}
				</>
			}
		>
			<Box sx={{ pt: 0.5 }}>
				<MatrixCellsGrid
					channels={channels}
					cells={matrix.map((row) => row.map(formatPercentCell))}
				/>
			</Box>
		</AppDialog>
	)
}
