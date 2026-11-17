import { describe, expect, it } from "vitest"
import { fileRelativePath } from "./experimentFile"

const fcs = (name: string, rel?: string) => {
	const file = new File(["x"], name, { type: "application/octet-stream" })
	if (rel !== undefined) {
		Object.defineProperty(file, "webkitRelativePath", { value: rel })
	}
	return file
}

describe("fileRelativePath (FE-54)", () => {
	it("arquivo solto não tem caminho", () => {
		expect(fileRelativePath(fcs("a.fcs"))).toBeUndefined()
	})

	it("arquivo na raiz da pasta escolhida fica sem subsample", () => {
		expect(fileRelativePath(fcs("a.fcs", "Pasta/a.fcs"))).toBeUndefined()
	})

	it("subdiretório vira caminho relativo", () => {
		expect(fileRelativePath(fcs("a.fcs", "Pasta/Compensation/a.fcs"))).toBe(
			"Compensation/a.fcs",
		)
	})

	it("subníveis preservam a hierarquia", () => {
		expect(
			fileRelativePath(fcs("a.fcs", "Pasta/tempo_1/controles/a.fcs")),
		).toBe("tempo_1/controles/a.fcs")
	})

	it("segmentos vazios são ignorados", () => {
		expect(fileRelativePath(fcs("a.fcs", "Pasta//sub//a.fcs"))).toBe(
			"sub/a.fcs",
		)
	})
})
