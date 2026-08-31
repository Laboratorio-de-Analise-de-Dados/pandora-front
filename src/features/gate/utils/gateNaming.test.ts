import { describe, expect, it } from "vitest"
import {
	GATE_NAME_MAX_LENGTH,
	getNextGateName,
	getNextQuadrantGroup,
	getQuadrantLabels,
	quadrantPrefixFits,
} from "./gateNaming"

describe("getNextGateName", () => {
	it("segue a sequencia P1, P2 na raiz da amostra", () => {
		expect(getNextGateName(new Set())).toBe("P1")
		expect(getNextGateName(new Set(["P1", "P2"]))).toBe("P3")
	})

	it("deriva o nome do parent dentro de um gate", () => {
		expect(getNextGateName(new Set(), "P1")).toBe("P1.1")
		expect(getNextGateName(new Set(["P1.1"]), "P1")).toBe("P1.2")
		expect(getNextGateName(new Set(), "P1.2")).toBe("P1.2.1")
	})

	it("nunca repete o nome do parent no filho", () => {
		const name = getNextGateName(new Set(), "P1")
		expect(name).not.toBe("P1")
	})

	it("volta para a sequencia simples quando o prefixo estoura o limite", () => {
		const deep = "P1".padEnd(GATE_NAME_MAX_LENGTH - 1, ".1")
		const name = getNextGateName(new Set(), deep)
		expect(name).toBe("P1")
		expect(name.length).toBeLessThanOrEqual(GATE_NAME_MAX_LENGTH)
	})
})

describe("quadrantes", () => {
	it("prefixa os 4 rotulos com o parent", () => {
		expect(getQuadrantLabels(1, "P1")).toEqual([
			"P1.Q1 (X+Y+)",
			"P1.Q1 (X-Y+)",
			"P1.Q1 (X-Y-)",
			"P1.Q1 (X+Y-)",
		])
	})

	it("avanca o grupo quando os rotulos ja existem", () => {
		const existing = new Set(getQuadrantLabels(1, "P1"))
		expect(getNextQuadrantGroup(existing, "P1")).toBe(2)
	})

	it("recusa o prefixo quando algum rotulo passaria do limite", () => {
		expect(quadrantPrefixFits(1, "P1")).toBe(true)
		expect(quadrantPrefixFits(1, "P".repeat(GATE_NAME_MAX_LENGTH))).toBe(false)
	})
})
