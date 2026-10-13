import { describe, expect, it } from "vitest"
import {
	controlKindForChannel,
	gateTypeForMode,
	gateTypeForTool,
	intentByValue,
	isFluorescenceChannel,
	isMorphologyChannel,
	SUGGEST_INTENTS,
	V1_INTENTS,
	V1_INTENTS_1D,
} from "./intents"

describe("SUGGEST_INTENTS", () => {
	it("cobre as cinco intenções do FE-42", () => {
		expect(SUGGEST_INTENTS.map((i) => i.value)).toEqual([
			"separate",
			"positive_negative",
			"quadrant",
			"rare",
			"control",
		])
	})

	it("só o modo controle exige arquivo de referência", () => {
		expect(
			SUGGEST_INTENTS.filter((i) => i.needsControl).map((i) => i.value),
		).toEqual(["control"])
	})
})

describe("intentByValue", () => {
	it("resolve a intenção pelo valor", () => {
		expect(intentByValue("quadrant").preferredGateType).toBe("quadrant")
	})

	it("valor desconhecido cai no default (separate)", () => {
		expect(intentByValue("x" as never).value).toBe("separate")
	})
})

describe("isMorphologyChannel / isFluorescenceChannel", () => {
	it("FSC/SSC são morfologia", () => {
		expect(isMorphologyChannel("FSC-A")).toBe(true)
		expect(isMorphologyChannel("ssc-h")).toBe(true)
		expect(isMorphologyChannel("CD3")).toBe(false)
	})

	it("fluorescência é o complemento", () => {
		expect(isFluorescenceChannel("CD3")).toBe(true)
		expect(isFluorescenceChannel("FITC-A")).toBe(true)
		expect(isFluorescenceChannel("FSC-A")).toBe(false)
	})
})

describe("controlKindForChannel", () => {
	it("canal fluorescente pede controle de fluorescência (FMO/isotípico)", () => {
		expect(controlKindForChannel("CD4")).toBe("fluorescence")
	})

	it("FSC/SSC pedem controle de população", () => {
		expect(controlKindForChannel("FSC-A")).toBe("population")
		expect(controlKindForChannel("SSC-A")).toBe("population")
	})
})

describe("gateTypeForTool", () => {
	it("mapeia a ferramenta ativa para o tipo de saída", () => {
		expect(gateTypeForTool("quad")).toBe("quadrant")
		expect(gateTypeForTool("poly")).toBe("polygon")
		expect(gateTypeForTool("rect")).toBe("rectangle")
		expect(gateTypeForTool("edit")).toBe("rectangle")
	})
})

describe("gateTypeForMode", () => {
	it("histograma é sempre interval, qualquer que seja a ferramenta (FE-45)", () => {
		expect(gateTypeForMode("histogram", "rect")).toBe("interval")
		expect(gateTypeForMode("histogram", "poly")).toBe("interval")
		expect(gateTypeForMode("histogram", "quad")).toBe("interval")
	})

	it("scatter/heatmap seguem a ferramenta ativa", () => {
		expect(gateTypeForMode("scatter", "quad")).toBe("quadrant")
		expect(gateTypeForMode("heatmap", "poly")).toBe("polygon")
	})
})

describe("V1_INTENTS_1D", () => {
	it("no 1D só 'separate' é atendida — intents 2D ficam de fora", () => {
		expect(V1_INTENTS_1D.has("separate")).toBe(true)
		expect(V1_INTENTS_1D.has("quadrant")).toBe(false)
		// E é um subconjunto estrito das intents que a v1 atende em 2D.
		for (const i of V1_INTENTS_1D) expect(V1_INTENTS.has(i)).toBe(true)
	})
})
