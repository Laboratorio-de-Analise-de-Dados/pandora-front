import { describe, expect, it } from "vitest"
import {
	buildCompensationPreviewMock,
	previewSpillCorrelation,
} from "./previewMock"

const CHANNELS = ["FITC-A", "PE-A", "APC-A"]
const IDENTITY = [
	[1, 0, 0],
	[0, 1, 0],
	[0, 0, 1],
]

describe("buildCompensationPreviewMock", () => {
	it("segue o contrato do density (heatmap)", () => {
		const res = buildCompensationPreviewMock({
			channels: CHANNELS,
			matrix: IDENTITY,
			xAxis: "FITC-A",
			yAxis: "PE-A",
		})
		expect(res.mode).toBe("heatmap")
		expect(res.x_label).toBe("FITC-A")
		expect(res.y_label).toBe("PE-A")
		expect(res.x_edges).toHaveLength(61)
		expect(res.y_edges).toHaveLength(61)
		expect(res.histogram).toHaveLength(60)
		expect(res.histogram?.[0]).toHaveLength(60)
		expect(res.total_events).toBeGreaterThan(0)
	})

	it("é determinística — mesma entrada, mesma saída", () => {
		const args = {
			channels: CHANNELS,
			matrix: IDENTITY,
			xAxis: "FITC-A",
			yAxis: "PE-A",
		}
		expect(buildCompensationPreviewMock(args)).toEqual(
			buildCompensationPreviewMock(args),
		)
	})

	it("spillover entre os canais dos eixos muda a figura", () => {
		const base = buildCompensationPreviewMock({
			channels: CHANNELS,
			matrix: IDENTITY,
			xAxis: "FITC-A",
			yAxis: "PE-A",
		})
		const spilling = buildCompensationPreviewMock({
			channels: CHANNELS,
			matrix: [
				[1, 0.3, 0],
				[0.1, 1, 0],
				[0, 0, 1],
			],
			xAxis: "FITC-A",
			yAxis: "PE-A",
		})
		expect(spilling.histogram).not.toEqual(base.histogram)
	})
})

describe("previewSpillCorrelation", () => {
	it("identidade → sem correlação", () => {
		expect(previewSpillCorrelation(CHANNELS, IDENTITY, "FITC-A", "PE-A")).toBe(
			0,
		)
	})

	it("off-diagonal entre os eixos vira correlação amplificada", () => {
		const m = [
			[1, 0.2, 0],
			[0.1, 1, 0],
			[0, 0, 1],
		]
		// (0.2 + 0.1) × 2 = 0.6
		expect(previewSpillCorrelation(CHANNELS, m, "FITC-A", "PE-A")).toBeCloseTo(
			0.6,
		)
	})

	it("ignora canais fora da matriz ou eixos iguais", () => {
		expect(previewSpillCorrelation(CHANNELS, IDENTITY, "FITC-A", "ZZZ")).toBe(0)
		expect(
			previewSpillCorrelation(CHANNELS, IDENTITY, "FITC-A", "FITC-A"),
		).toBe(0)
	})

	it("limita ρ em ±0.95 pra gaussiana não degenerar", () => {
		const m = [
			[1, 0.9, 0],
			[0.9, 1, 0],
			[0, 0, 1],
		]
		expect(previewSpillCorrelation(CHANNELS, m, "FITC-A", "PE-A")).toBe(0.95)
	})
})
