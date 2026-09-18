import { describe, expect, it } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { ConfirmDialogProvider, useConfirm } from "./index"

function Probe() {
	const confirm = useConfirm()
	const [result, setResult] = useState<string>("")
	return (
		<button
			onClick={async () =>
				setResult(
					(await confirm({
						title: "Desativar experimento",
						description: "Os dados são preservados.",
						severity: "danger",
					}))
						? "yes"
						: "no",
				)
			}
		>
			{result || "abrir"}
		</button>
	)
}

const renderProbe = () =>
	render(
		<ConfirmDialogProvider>
			<Probe />
		</ConfirmDialogProvider>,
	)

describe("ConfirmDialog", () => {
	it("resolve true ao confirmar", async () => {
		renderProbe()
		await userEvent.click(screen.getByText("abrir"))
		expect(await screen.findByText("Desativar experimento")).toBeInTheDocument()
		await userEvent.click(screen.getByText("Confirmar"))
		await waitFor(() => expect(screen.getByText("yes")).toBeInTheDocument())
	})

	it("resolve false ao cancelar e ao fechar pelo backdrop", async () => {
		renderProbe()
		const open = screen.getByText("abrir")
		await userEvent.click(open)
		await userEvent.click(await screen.findByText("Cancelar"))
		await waitFor(() => expect(screen.getByText("no")).toBeInTheDocument())

		await userEvent.click(open)
		await screen.findByText("Desativar experimento")
		await userEvent.keyboard("{Escape}")
		await waitFor(() => expect(screen.getByText("no")).toBeInTheDocument())
	})

	it("mostra o corpo e label customizado", async () => {
		renderProbe()
		await userEvent.click(screen.getByText("abrir"))
		expect(
			await screen.findByText("Os dados são preservados."),
		).toBeInTheDocument()
	})
})
