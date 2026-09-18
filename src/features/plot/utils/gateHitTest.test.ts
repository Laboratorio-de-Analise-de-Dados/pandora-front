import { describe, expect, it } from "vitest"
import { findQuadrantFamily, isPointInGate } from "./gateHitTest"
import type { Gate, QuadrantGateCoordinates } from "../../../types"

const quadCoords = (
	quadrant: QuadrantGateCoordinates["quadrant"],
	center_x = 4,
	center_y = 7,
): QuadrantGateCoordinates => ({
	type: "quadrant",
	quadrant,
	x_axis: "FSC-A",
	y_axis: "SSC-A",
	center_x,
	center_y,
})

describe("isPointInGate — quadrant", () => {
	it("acerta cada região pelo sinal do quadrante", () => {
		// cruz em (4, 7): Q1=X+Y+, Q2=X−Y+, Q3=X−Y−, Q4=X+Y−
		expect(
			isPointInGate(6, 8, quadCoords("Q1"), false, "linear", "linear"),
		).toBe(true)
		expect(
			isPointInGate(2, 8, quadCoords("Q1"), false, "linear", "linear"),
		).toBe(false)
		expect(
			isPointInGate(2, 8, quadCoords("Q2"), false, "linear", "linear"),
		).toBe(true)
		expect(
			isPointInGate(2, 3, quadCoords("Q3"), false, "linear", "linear"),
		).toBe(true)
		expect(
			isPointInGate(6, 3, quadCoords("Q4"), false, "linear", "linear"),
		).toBe(true)
	})

	it("fronteira pertence ao lado X+/Y+ (mesma regra do backend)", () => {
		// backend: X+ usa >=, X− usa <; Y+ usa >=, Y− usa <
		expect(
			isPointInGate(4, 7, quadCoords("Q1"), false, "linear", "linear"),
		).toBe(true)
		expect(
			isPointInGate(4, 7, quadCoords("Q3"), false, "linear", "linear"),
		).toBe(false)
	})

	it("respeita eixos trocados (swapped)", () => {
		// swapped: displayX = eixo Y do gate — o quadrante Q1 continua
		// acertando o canto que ele representa visualmente.
		expect(
			isPointInGate(8, 6, quadCoords("Q1"), true, "linear", "linear"),
		).toBe(true)
		expect(
			isPointInGate(8, 6, quadCoords("Q3"), true, "linear", "linear"),
		).toBe(false)
	})
})

const makeGate = (over: Partial<Gate> = {}): Gate =>
	({
		id: 1,
		name: "Q1",
		parent_id: 10,
		file_data: 5,
		dashboard: 1,
		gate_coordinates: quadCoords("Q1"),
		...over,
	}) as Gate

describe("findQuadrantFamily", () => {
	const family = [
		makeGate({ id: 1, name: "Q1", gate_coordinates: quadCoords("Q1") }),
		makeGate({ id: 2, name: "Q2", gate_coordinates: quadCoords("Q2") }),
		makeGate({ id: 3, name: "Q3", gate_coordinates: quadCoords("Q3") }),
		makeGate({ id: 4, name: "Q4", gate_coordinates: quadCoords("Q4") }),
	]

	it("reúne os 4 quadrantes da mesma cruz", () => {
		const found = findQuadrantFamily(family, family[0])
		expect(found.map((g) => g.id).sort()).toEqual([1, 2, 3, 4])
	})

	it("não mistura conjuntos de quadrantes diferentes", () => {
		const otherCross = makeGate({
			id: 9,
			name: "Q1 (2)",
			gate_coordinates: quadCoords("Q1", 40, 70),
		})
		const otherParent = makeGate({
			id: 10,
			name: "Q1 (3)",
			parent_id: 99,
			gate_coordinates: quadCoords("Q1"),
		})
		const found = findQuadrantFamily(
			[...family, otherCross, otherParent],
			family[0],
		)
		expect(found.map((g) => g.id).sort()).toEqual([1, 2, 3, 4])
	})

	it("ignora gates que não são quadrante no mesmo parent", () => {
		const rect = makeGate({
			id: 20,
			name: "P1",
			gate_coordinates: {
				type: "rectangle",
				x_axis: "FSC-A",
				y_axis: "SSC-A",
				startX: 0,
				endX: 10,
				startY: 0,
				endY: 10,
			},
		})
		const found = findQuadrantFamily([...family, rect], family[0])
		expect(found.map((g) => g.id).sort()).toEqual([1, 2, 3, 4])
	})

	it("devolve só o próprio gate quando não é quadrante", () => {
		const rect = makeGate({
			id: 20,
			gate_coordinates: {
				type: "rectangle",
				startX: 0,
				endX: 10,
				startY: 0,
				endY: 10,
			},
		})
		expect(findQuadrantFamily([rect, ...family], rect)).toEqual([rect])
	})
})
