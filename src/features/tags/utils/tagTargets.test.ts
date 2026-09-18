import { describe, expect, it } from "vitest"
import { commonTagIds, computeTagTargets } from "./tagTargets"
import { tagInitials } from "./tagInitials"
import type { ExperimentFiles, SampleTag } from "../../../types"

describe("tagInitials", () => {
	it("pega a inicial de cada palavra (máx. 3)", () => {
		expect(tagInitials("Referência biológica")).toBe("RB")
		expect(tagInitials("Negativo (unstained)")).toBe("NU")
		expect(tagInitials("lote 3")).toBe("L3")
	})

	it("palavra única pega até 3 letras", () => {
		expect(tagInitials("FMO")).toBe("FMO")
		expect(tagInitials("beads")).toBe("BEA")
	})
})

const tag = (id: number): SampleTag => ({
	id,
	name: `tag-${id}`,
	system_key: null,
	category: "general",
	color: "#6b7280",
	scope: "personal",
	organization: null,
})

const file = (id: number, tagIds: number[]): ExperimentFiles => ({
	id,
	file_name: `f${id}.fcs`,
	gates: [],
	active: true,
	deactivated_at: null,
	tags: tagIds.map(tag),
})

describe("commonTagIds", () => {
	it("intersecta as tags explícitas de todas as amostras", () => {
		const files = [file(1, [1, 2]), file(2, [2, 3]), file(3, [2, 4])]
		expect([...commonTagIds(files)]).toEqual([2])
	})

	it("vazio quando uma amostra não tem tags", () => {
		expect([...commonTagIds([file(1, [1]), file(2, [])])]).toEqual([])
	})
})

describe("computeTagTargets", () => {
	it("amostra única grava exatamente o conjunto selecionado", () => {
		const targets = computeTagTargets([file(1, [1])], new Set([1, 5]))
		expect(targets).toEqual([{ fileDataId: 1, tagIds: [1, 5] }])
	})

	it("em lote, marcação nova é adicionada preservando tags não-comuns", () => {
		// f1 tem {1,2}; f2 tem {2,3} — comum {2}; usuário liga 9 →
		// f1={1,2,9}, f2={2,3,9} (o 1 de f1 e o 3 de f2 não somem).
		const files = [file(1, [1, 2]), file(2, [2, 3])]
		const targets = computeTagTargets(files, new Set([2, 9]))
		expect(targets[0].tagIds.sort()).toEqual([1, 2, 9])
		expect(targets[1].tagIds.sort()).toEqual([2, 3, 9])
	})

	it("em lote, desmarcar tag comum remove só ela", () => {
		const files = [file(1, [1, 2]), file(2, [2, 3])]
		const targets = computeTagTargets(files, new Set())
		expect(targets[0].tagIds).toEqual([1])
		expect(targets[1].tagIds).toEqual([3])
	})
})
