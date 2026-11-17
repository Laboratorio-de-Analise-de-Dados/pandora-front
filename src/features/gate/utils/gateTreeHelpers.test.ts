import { describe, expect, it } from "vitest"
import type { ExperimentFiles, Gate } from "../../../types"
import { gatesAtSamePath } from "./gateTreeHelpers"

const gate = (id: number, name: string, children?: Gate[]): Gate => ({
	id,
	name,
	parent_id: null,
	gate_coordinates: { type: "rectangle" } as Gate["gate_coordinates"],
	file_data: 1,
	dashboard: 1,
	children,
})

const file = (id: number, gates: Gate[]): ExperimentFiles =>
	({ id, gates }) as unknown as ExperimentFiles

describe("gatesAtSamePath", () => {
	it("retorna o gate na mesma posição da árvore em cada amostra", () => {
		const files = [
			file(1, [gate(10, "Singlets", [gate(11, "CD3")])]),
			file(2, [gate(20, "Singlets", [gate(21, "CD3")])]),
			file(3, [gate(30, "Singlets", [gate(31, "CD3")])]),
		]
		const targets = gatesAtSamePath(files, ["Singlets", "CD3"])
		expect(targets.map((g) => g.id)).toEqual([11, 21, 31])
	})

	it("não casa gate de mesmo nome em profundidade diferente", () => {
		const files = [
			file(1, [gate(10, "Singlets", [gate(11, "CD3")])]),
			file(2, [gate(21, "CD3")]), // "CD3" na raiz, não sob "Singlets"
		]
		const targets = gatesAtSamePath(files, ["Singlets", "CD3"])
		expect(targets.map((g) => g.id)).toEqual([11])
	})

	it("não casa quando o nome do pai difere", () => {
		const files = [
			file(1, [gate(10, "Singlets", [gate(11, "CD3")])]),
			file(2, [gate(20, "Debris", [gate(21, "CD3")])]),
		]
		const targets = gatesAtSamePath(files, ["Singlets", "CD3"])
		expect(targets.map((g) => g.id)).toEqual([11])
	})

	it("ignora amostras que não têm o caminho", () => {
		const files = [file(1, [gate(10, "Singlets")]), file(2, [])]
		const targets = gatesAtSamePath(files, ["Singlets", "CD3"])
		expect(targets).toEqual([])
	})

	it("casa gates na raiz por nome", () => {
		const files = [
			file(1, [gate(10, "Linfócitos"), gate(11, "Outros")]),
			file(2, [gate(20, "Linfócitos")]),
		]
		const targets = gatesAtSamePath(files, ["Linfócitos"])
		expect(targets.map((g) => g.id)).toEqual([10, 20])
	})
})
