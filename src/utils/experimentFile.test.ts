import { describe, expect, it } from "vitest"
import { isAcceptedExperimentFile } from "./experimentFile"

describe("isAcceptedExperimentFile", () => {
	it("aceita .fcs e .zip ignorando caixa", () => {
		expect(isAcceptedExperimentFile("amostra.fcs")).toBe(true)
		expect(isAcceptedExperimentFile("Amostras.ZIP")).toBe(true)
	})

	it("rejeita outras extensões", () => {
		expect(isAcceptedExperimentFile("amostra.csv")).toBe(false)
		expect(isAcceptedExperimentFile("amostra")).toBe(false)
		expect(isAcceptedExperimentFile("")).toBe(false)
	})
})
