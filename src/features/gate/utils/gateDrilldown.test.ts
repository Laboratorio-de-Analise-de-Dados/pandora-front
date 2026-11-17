import { describe, expect, it } from "vitest"
import type { ExperimentFiles, Gate } from "../../../types"
import { drilldownTarget } from "./gateDrilldown"

const gate = (over: Partial<Gate> = {}): Gate =>
	({
		id: 1,
		name: "P1",
		parent_id: null,
		gate_coordinates: {
			type: "rectangle",
			x_axis: "FSC-A",
			y_axis: "SSC-A",
			x: [1, 5],
			y: [2, 8],
		},
		file_data: 10,
		dashboard: 1,
		...over,
	}) as Gate

const file = (gates: Gate[]): ExperimentFiles =>
	({ id: 10, file_name: "a.fcs", gates }) as ExperimentFiles

describe("drilldownTarget (FE-52)", () => {
	it("gate sem filho → cria NewGate com parent + geometria copiada", () => {
		const parent = gate()
		const result = drilldownTarget(parent, file([parent]))
		expect(result.kind).toBe("create")
		if (result.kind !== "create") return
		expect(result.gate.parent).toBe(parent.id)
		expect(result.gate.file_data).toBe(10)
		expect(result.gate.gate_coordinates).toEqual(parent.gate_coordinates)
		expect(result.gate.name).toBe("P1.1")
	})

	it("gate com filho → navega para o filho existente, sem duplicar", () => {
		const child = gate({ id: 2, name: "P1.1", parent_id: 1 })
		const parent = gate({ children: [child] })
		const result = drilldownTarget(parent, file([parent]))
		expect(result).toEqual({ kind: "navigate", gate: child })
	})

	it("vários filhos → navega para o primeiro", () => {
		const c1 = gate({ id: 2, name: "P1.1", parent_id: 1 })
		const c2 = gate({ id: 3, name: "P1.2", parent_id: 1 })
		const parent = gate({ children: [c1, c2] })
		const result = drilldownTarget(parent, file([parent]))
		expect(result.kind).toBe("navigate")
		if (result.kind !== "navigate") return
		expect(result.gate.id).toBe(2)
	})
})
