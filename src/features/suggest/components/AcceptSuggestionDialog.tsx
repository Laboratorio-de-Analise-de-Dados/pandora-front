import { TextField, Typography } from "@mui/material"
import { useState } from "react"
import { AppDialog } from "../../../components/AppDialog"
import type { ContextSuggestion } from "../utils/contextFilter"

export interface AcceptSuggestionDialogProps {
	suggestion: ContextSuggestion | null
	/** true = "editar e aceitar" — a geometria vai para revisão depois. */
	editing: boolean
	saving: boolean
	onClose: () => void
	onConfirm: (name: string | undefined) => void
}

/**
 * FE-42 §5 — ao aceitar uma candidata o usuário pode nomear a população
 * ("que população é essa?"). O nome vira o nome do gate e o label
 * semântico do dataset de outcomes; vazio = nome automático do backend.
 */
export default function AcceptSuggestionDialog({
	suggestion,
	editing,
	saving,
	onClose,
	onConfirm,
}: AcceptSuggestionDialogProps) {
	const [name, setName] = useState("")

	return (
		<AppDialog
			open={suggestion != null}
			onClose={onClose}
			title={editing ? "Revisar sugestão" : "Aceitar sugestão"}
			onConfirm={() => {
				onConfirm(name.trim() || undefined)
				setName("")
			}}
			confirmLabel={editing ? "Aceitar e editar" : "Aceitar"}
			loading={saving}
		>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				{editing
					? "A população vira gate na árvore e entra em modo de edição para você ajustar a geometria."
					: "A população sugerida vira um gate na árvore, como qualquer gate desenhado à mão."}
			</Typography>
			<TextField
				label="Nome da população (opcional)"
				placeholder="Ex.: Linfócitos, CD4+…"
				size="small"
				fullWidth
				autoFocus
				value={name}
				onChange={(e) => setName(e.target.value)}
			/>
		</AppDialog>
	)
}
