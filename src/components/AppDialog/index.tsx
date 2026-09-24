import React from "react"
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
} from "@mui/material"

/**
 * Shell base de dialog do Pandora (ADR-0014): encapsula a anatomia
 * padrão (título + corpo + ações) no tema da app. Dialogs novos partem
 * daqui e só trocam o conteúdo — nunca `Dialog` MUI cru nem APIs
 * nativas do browser.
 *
 * - `children` = corpo (form, texto, lista...)
 * - `actions` customizáveis via prop; o default é Cancelar/Confirmar
 *   com `confirmColor="error"` para ações destrutivas
 * - `loading` desabilita os botões enquanto a ação roda
 */

export interface AppDialogProps {
	open: boolean
	title: React.ReactNode
	onClose: () => void
	children?: React.ReactNode
	/** Ações customizadas; se omitido, renderiza Cancelar/Confirmar. */
	actions?: React.ReactNode
	onConfirm?: () => void
	confirmLabel?: string
	cancelLabel?: string
	confirmColor?: "primary" | "error"
	confirmDisabled?: boolean
	/** Desligar quando o foco inicial pertence a um campo do corpo (form). */
	confirmAutoFocus?: boolean
	loading?: boolean
	maxWidth?: "xs" | "sm" | "md"
}

export const AppDialog: React.FC<AppDialogProps> = ({
	open,
	title,
	onClose,
	children,
	actions,
	onConfirm,
	confirmLabel = "Confirmar",
	cancelLabel = "Cancelar",
	confirmColor = "primary",
	confirmDisabled = false,
	confirmAutoFocus = true,
	loading = false,
	maxWidth = "xs",
}) => (
	<Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
		<DialogTitle>{title}</DialogTitle>
		{children && <DialogContent>{children}</DialogContent>}
		<DialogActions>
			{actions ?? (
				<>
					<Button onClick={onClose} disabled={loading}>
						{cancelLabel}
					</Button>
					{onConfirm && (
						<Button
							variant="contained"
							color={confirmColor}
							onClick={onConfirm}
							disabled={confirmDisabled || loading}
							autoFocus={confirmAutoFocus}
							data-mui-focusable={confirmAutoFocus ? true : undefined}
						>
							{confirmLabel}
						</Button>
					)}
				</>
			)}
		</DialogActions>
	</Dialog>
)
