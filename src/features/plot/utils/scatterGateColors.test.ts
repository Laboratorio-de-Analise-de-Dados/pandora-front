import { describe, expect, it } from "vitest"
import { scatterGatePointColors } from "./scatterGateColors"
import { getGateColor, hexToRgba } from "../../../constants/gateColors"
import type { Gate } from "../../../types"

const BASE = "rgba(5, 150, 105, 0.7)"

const makeGate = (over: Partial<Gate> = {}): Gate =>
	({
		id: 1,
		name: "P1",
		color: null,
		gate_coordinates: {
			type: "rectangle",
			x_axis: "FSC-A",
			y_axis: "SSC-A",
			startX: 0,
			endX: 10,
			startY: 0,
			endY: 10,
		},
		...over,
	}) as Gate

describe("scatterGatePointColors", () => {
	it("pontos dentro do retângulo ganham a cor do gate", () => {
		const colors = scatterGatePointColors(
			[5, 50],
			[5, 50],
			[makeGate()],
			"FSC-A",
			"SSC-A",
			"linear",
			"linear",
			BASE,
		)
		expect(colors?.[0]).toBe(hexToRgba(getGateColor(null, 0), 0.85))
		expect(colors?.[1]).toBe(BASE)
	})

	it("quadrante colore só a região dele", () => {
		const q2 = makeGate({
			gate_coordinates: {
				type: "quadrant",
				quadrant: "Q2",
				x_axis: "FSC-A",
				y_axis: "SSC-A",
				center_x: 10,
				center_y: 10,
			},
		})
		const colors = scatterGatePointColors(
			[5, 15, 5, 15],
			[15, 15, 5, 5],
			[q2],
			"FSC-A",
			"SSC-A",
			"linear",
			"linear",
			BASE,
		)
		// Q2 = X- Y+ → só o ponto (5,15)
		expect(colors).toEqual([
			hexToRgba(getGateColor(null, 0), 0.85),
			BASE,
			BASE,
			BASE,
		])
	})

	it("eixos trocados: gate FSC×SSC colore no plot SSC×FSC", () => {
		const colors = scatterGatePointColors(
			[5, 50], // x da tela = SSC-A
			[5, 50], // y da tela = FSC-A
			[makeGate()],
			"SSC-A",
			"FSC-A",
			"linear",
			"linear",
			BASE,
		)
		expect(colors?.[0]).toBe(hexToRgba(getGateColor(null, 0), 0.85))
		expect(colors?.[1]).toBe(BASE)
	})

	it("gate de outros eixos não colore nada", () => {
		const gate = makeGate({
			gate_coordinates: {
				type: "rectangle",
				x_axis: "PE-A",
				y_axis: "APC-A",
				startX: 0,
				endX: 10,
				startY: 0,
				endY: 10,
			},
		})
		expect(
			scatterGatePointColors(
				[5],
				[5],
				[gate],
				"FSC-A",
				"SSC-A",
				"linear",
				"linear",
				BASE,
			),
		).toBeNull()
	})

	it("sobreposição: o último gate da lista vence", () => {
		const g1 = makeGate({ id: 1 })
		const g2 = makeGate({ id: 2, color: "#ff0000" })
		const colors = scatterGatePointColors(
			[5],
			[5],
			[g1, g2],
			"FSC-A",
			"SSC-A",
			"linear",
			"linear",
			BASE,
		)
		expect(colors?.[0]).toBe(hexToRgba("#ff0000", 0.85))
	})

	it("polígono colore pontos internos", () => {
		const tri = makeGate({
			gate_coordinates: {
				type: "polygon",
				x_axis: "FSC-A",
				y_axis: "SSC-A",
				vertices: [
					[0, 0],
					[10, 0],
					[0, 10],
				],
			},
		})
		const colors = scatterGatePointColors(
			[2, 8],
			[2, 8],
			[tri],
			"FSC-A",
			"SSC-A",
			"linear",
			"linear",
			BASE,
		)
		expect(colors?.[0]).toBe(hexToRgba(getGateColor(null, 0), 0.85))
		expect(colors?.[1]).toBe(BASE)
	})
})
