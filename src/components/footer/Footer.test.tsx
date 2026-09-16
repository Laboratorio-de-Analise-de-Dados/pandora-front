import { expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import Footer from "."

test("renders footer credit text", () => {
	render(
		<MemoryRouter initialEntries={["/"]}>
			<Footer />
		</MemoryRouter>,
	)
	expect(screen.getByText(/Datalab/i)).toBeInTheDocument()
})

test("hidden inside the experiment workspace", () => {
	const { container } = render(
		<MemoryRouter initialEntries={["/experiments/7"]}>
			<Footer />
		</MemoryRouter>,
	)
	expect(container).toBeEmptyDOMElement()
})
