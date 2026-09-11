import { describe, expect, it } from "vitest"
import type { ExperimentFiles, Gate } from "../../../types"
import { getCopyFamilyIds, getCopyFamilyRootId } from "./gateTreeHelpers"

const gate = (
	id: number,
	name: string,
	copiedFromId: number | null = null,
	children: Gate[] = [],
): Gate =>
	({
		id,
		name,
		parent_id: null,
		gate_coordinates: { type: "rectangle" } as Gate["gate_coordinates"],
		file_data: 1,
		copied_from_id: copiedFromId,
		children,
	}) as Gate

describe("família de cópias de gate", () => {
	const tree: ExperimentFiles[] = [
		{ id: 1, gates: [gate(1, "P1")] },
		{ id: 2, gates: [gate(2, "P1", 1)] },
		{ id: 3, gates: [gate(3, "P1", 1)] },
		{ id: 4, gates: [gate(4, "P1")] },
	] as unknown as ExperimentFiles[]

	it("usa o próprio gate como raiz quando ele é o original", () => {
		expect(getCopyFamilyRootId(tree, 1)).toBe(1)
	})

	it("agrupa original e cópias, ignorando homônimos sem linhagem", () => {
		expect(getCopyFamilyIds(tree, 2).sort()).toEqual([1, 2, 3])
		expect(getCopyFamilyIds(tree, 4)).toEqual([4])
	})

	it("deixa a cópia desanexada fora da família original", () => {
		const detached: ExperimentFiles[] = [
			{ id: 1, gates: [gate(1, "P1")] },
			{ id: 2, gates: [gate(2, "P1", 1)] },
			{ id: 3, gates: [gate(3, "P1")] },
		] as unknown as ExperimentFiles[]

		expect(getCopyFamilyIds(detached, 1).sort()).toEqual([1, 2])
		expect(getCopyFamilyIds(detached, 3)).toEqual([3])
	})

	it("encontra cópias de sub-gates dentro da árvore", () => {
		const nested: ExperimentFiles[] = [
			{ id: 1, gates: [gate(1, "P1", null, [gate(10, "P1.1")])] },
			{ id: 2, gates: [gate(2, "P1", 1, [gate(20, "P1.1", 10)])] },
		] as unknown as ExperimentFiles[]

		expect(getCopyFamilyIds(nested, 20).sort()).toEqual([10, 20])
	})
})
