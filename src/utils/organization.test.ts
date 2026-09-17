import { expect, test } from "vitest"
import { orgTypeLabel, pluralPt } from "./organization"

test("orgTypeLabel traduz os tipos conhecidos", () => {
	expect(orgTypeLabel.lab).toBe("Laboratório")
	expect(orgTypeLabel.cliente).toBe("Cliente")
})

test("pluralPt alterna singular e plural", () => {
	expect(pluralPt(1, "membro", "membros")).toBe("1 membro")
	expect(pluralPt(3, "membro", "membros")).toBe("3 membros")
	expect(pluralPt(0, "experimento ativo", "experimentos ativos")).toBe(
		"0 experimentos ativos",
	)
})
