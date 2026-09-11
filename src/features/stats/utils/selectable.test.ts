import { describe, expect, it } from "vitest"
import type { ExperimentFiles, Gate } from "../../../types"
import { buildSelectableItems } from "./selectable"

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
		gate_coordinates: { type: "rectangle" },
		file_data: 1,
		copied_from_id: copiedFromId,
		children,
	}) as unknown as Gate

const groupOf = (items: ReturnType<typeof buildSelectableItems>, id: number) =>
	items.find((i) => i.type === "gate" && i.id === id)?.groupKey

describe("buildSelectableItems", () => {
	it("agrupa a cópia com o original e mantém homônimos sem linhagem separados", () => {
		const files = [
			{ id: 1, file_name: "a.fcs", gates: [gate(1, "P1")] },
			{ id: 2, file_name: "b.fcs", gates: [gate(2, "P1", 1)] },
			{ id: 3, file_name: "c.fcs", gates: [gate(3, "P1")] },
		] as unknown as ExperimentFiles[]

		const items = buildSelectableItems(files)

		expect(groupOf(items, 2)).toBe(groupOf(items, 1))
		expect(groupOf(items, 3)).not.toBe(groupOf(items, 1))
	})

	it("separa gates homônimos em ramos diferentes do mesmo arquivo", () => {
		const files = [
			{
				id: 1,
				file_name: "a.fcs",
				gates: [
					gate(1, "P1", null, [gate(10, "P2")]),
					gate(2, "P3", null, [gate(20, "P2")]),
				],
			},
		] as unknown as ExperimentFiles[]

		const items = buildSelectableItems(files)

		expect(groupOf(items, 10)).toBe("path:P1 > P2")
		expect(groupOf(items, 20)).toBe("path:P3 > P2")
	})

	it("monta o caminho do gate com e sem o nome do arquivo", () => {
		const files = [
			{
				id: 1,
				file_name: "a.fcs",
				gates: [gate(1, "P1", null, [gate(10, "P1.1")])],
			},
		] as unknown as ExperimentFiles[]

		const child = buildSelectableItems(files).find((i) => i.id === 10)

		expect(child?.path).toBe("a.fcs > P1 > P1.1")
		expect(child?.gatePath).toBe("P1 > P1.1")
	})
})
