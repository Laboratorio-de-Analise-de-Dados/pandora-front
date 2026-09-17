import { expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Footer from "."

test("renders footer credit text", () => {
	render(
		<MemoryRouter initialEntries={["/"]}>
			<Footer />
		</MemoryRouter>,
	)
	expect(screen.getByText(/LIMC-IA/i)).toBeInTheDocument()
})

test("exibe a versão quando injetada no build", () => {
	vi.stubEnv("VITE_APP_VERSION", "v9.9.9")
	render(
		<MemoryRouter initialEntries={["/"]}>
			<Footer />
		</MemoryRouter>,
	)
	expect(screen.getByText(/v9\.9\.9/)).toBeInTheDocument()
	vi.unstubAllEnvs()
})

test("omite a versão quando a variável não existe", () => {
	render(
		<MemoryRouter initialEntries={["/"]}>
			<Footer />
		</MemoryRouter>,
	)
	expect(screen.queryByText(/·\s*v/)).not.toBeInTheDocument()
})

test("hidden inside the experiment workspace", () => {
	const { container } = render(
		<MemoryRouter initialEntries={["/experiments/7"]}>
			<Footer />
		</MemoryRouter>,
	)
	expect(container).toBeEmptyDOMElement()
})
