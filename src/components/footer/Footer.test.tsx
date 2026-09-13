import { expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import Footer from "."

test("renders footer credit text", () => {
	render(<Footer />)
	expect(screen.getByText(/Datalab/i)).toBeInTheDocument()
})
