import { describe, expect, it } from "vitest"
import { StrictMode } from "react"
import { render, screen } from "@testing-library/react"
import { TextField } from "@mui/material"
import { AppDialog } from "./index"

function FormDialog({ open }: { open: boolean }) {
	return (
		<AppDialog
			open={open}
			title="Novo subsample"
			onClose={() => {}}
			onConfirm={() => {}}
			confirmLabel="Salvar"
			confirmDisabled
			confirmAutoFocus={false}
		>
			<TextField
				autoFocus
				slotProps={{ htmlInput: { "data-mui-focusable": true } }}
				label="Nome do subsample"
				fullWidth
			/>
		</AppDialog>
	)
}

describe("foco inicial", () => {
	it("input com autoFocus recebe foco ao abrir o AppDialog", async () => {
		const { rerender } = render(
			<StrictMode>
				<FormDialog open={false} />
			</StrictMode>,
		)
		rerender(
			<StrictMode>
				<FormDialog open={true} />
			</StrictMode>,
		)
		await screen.findByLabelText("Nome do subsample")
		const input = screen.getByLabelText("Nome do subsample")
		expect(input).toHaveAttribute("data-mui-focusable")
		expect(document.activeElement).toBe(input)
	})
})
