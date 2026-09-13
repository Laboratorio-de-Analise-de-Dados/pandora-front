import React from "react"
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from "@mui/material"
import type { GateScope } from "../../../../../services/gateService"

interface ReshapeScopeDialogProps {
	open: boolean
	gateName: string
	familySize: number
	/** Nome do subsample da amostra atual; habilita o escopo intermediário. */
	subsampleName?: string
	onConfirm: (scope: GateScope) => void
	onCancel: () => void
}

const ReshapeScopeDialog: React.FC<ReshapeScopeDialogProps> = ({
	open,
	gateName,
	familySize,
	subsampleName,
	onConfirm,
	onCancel,
}) => (
	<Dialog
		open={open}
		onClose={onCancel}
		maxWidth="xs"
		fullWidth
		PaperProps={{ sx: { maxHeight: "90vh", overflowY: "auto" } }}
	>
		<DialogTitle>Alterar o desenho do gate</DialogTitle>
		<DialogContent>
			<Typography variant="body2">
				<strong>{gateName}</strong> está aplicado em {familySize} amostras.
				Alterar só nesta amostra torna este gate independente: ele deixa de
				acompanhar mudanças de nome, cor e exclusão feitas no grupo.
			</Typography>
		</DialogContent>
		<DialogActions
			sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 1, p: 2 }}
		>
			<Button onClick={onCancel} fullWidth>
				Cancelar
			</Button>
			<Button onClick={() => onConfirm("file")} fullWidth>
				Só nesta amostra
			</Button>
			{subsampleName && (
				<Button onClick={() => onConfirm("subsample")} fullWidth>
					Neste subsample ({subsampleName})
				</Button>
			)}
			<Button
				onClick={() => onConfirm("experiment")}
				variant="contained"
				fullWidth
			>
				Em todas ({familySize})
			</Button>
		</DialogActions>
	</Dialog>
)

export default ReshapeScopeDialog
