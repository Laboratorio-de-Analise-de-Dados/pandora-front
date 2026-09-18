import React, {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react"
import { Typography } from "@mui/material"
import { AppDialog } from "../AppDialog"

/**
 * Confirmação bloqueante no padrão MUI (ADR-0014) — substitui o
 * `window.confirm` nativo, que ignora o tema e não é acessível.
 *
 * Uso: `const confirm = useConfirm()` → `await confirm({ title, ... })`
 * resolve `true`/`false`. Qualquer saída (Cancelar, Esc, backdrop)
 * resolve — a Promise nunca fica pendurada.
 */

export interface ConfirmOptions {
	title: string
	description?: React.ReactNode
	confirmLabel?: string
	cancelLabel?: string
	severity?: "default" | "danger"
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | undefined>(undefined)

export const useConfirm = (): ConfirmFn => {
	const confirm = useContext(ConfirmContext)
	if (!confirm)
		throw new Error("useConfirm must be used inside ConfirmDialogProvider")
	return confirm
}

export const ConfirmDialogProvider: React.FC<{
	children: React.ReactNode
}> = ({ children }) => {
	const [options, setOptions] = useState<ConfirmOptions | null>(null)
	const resolverRef = useRef<((value: boolean) => void) | null>(null)

	const confirm = useCallback<ConfirmFn>((opts) => {
		return new Promise<boolean>((resolve) => {
			// Se uma confirmação anterior ficou aberta, resolve como cancelada.
			resolverRef.current?.(false)
			resolverRef.current = resolve
			setOptions(opts)
		})
	}, [])

	const settle = (value: boolean) => {
		resolverRef.current?.(value)
		resolverRef.current = null
		setOptions(null)
	}

	return (
		<ConfirmContext.Provider value={confirm}>
			{children}
			{options && (
				<AppDialog
					open
					title={options.title}
					onClose={() => settle(false)}
					onConfirm={() => settle(true)}
					confirmLabel={options.confirmLabel}
					cancelLabel={options.cancelLabel}
					confirmColor={options.severity === "danger" ? "error" : "primary"}
				>
					{options.description && (
						<Typography variant="body2" color="text.secondary">
							{options.description}
						</Typography>
					)}
				</AppDialog>
			)}
		</ConfirmContext.Provider>
	)
}
