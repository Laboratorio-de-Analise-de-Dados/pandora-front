import { describe, expect, it } from "vitest"
import type { DensityResponse } from "../../../types"
import { buildPlotData, hasPlotData } from "./plotTraces"

const density: DensityResponse = {
	mode: "heatmap",
	total_events: 100,
	x_label: "FL1-A",
	y_label: "FL2-A",
	histogram: [
		[1, null],
		[3, 5],
	],
	x_edges: [0, 1, 2],
	y_edges: [0, 1, 2],
}

interface DensityTrace {
	type?: string
	z?: unknown
	x?: unknown
	y?: unknown
	colorbar?: { title?: { text?: string } }
}

describe("buildPlotData — heatmap legível e contour (FE-50)", () => {
	it("heatmap titula a colorbar com a unidade do z", () => {
		const [trace] = buildPlotData("heatmap", density, "light") as [DensityTrace]
		expect(trace.type).toBe("heatmap")
		expect(trace.colorbar?.title?.text).toBe("eventos/bin")
	})

	it("contour monta isolinhas sobre o mesmo histogram do heatmap", () => {
		const [trace] = buildPlotData("contour", density, "dark") as [DensityTrace]
		expect(trace.type).toBe("contour")
		expect(trace.z).toEqual(density.histogram)
		expect(trace.x).toEqual([0.5, 1.5])
		expect(trace.y).toEqual([0.5, 1.5])
	})
})

describe("hasPlotData — contour", () => {
	it("aceita o histogram como fonte, igual ao heatmap", () => {
		expect(hasPlotData("contour", density)).toBe(true)
		expect(hasPlotData("contour", { ...density, histogram: [] })).toBe(false)
		expect(hasPlotData("contour", undefined)).toBe(false)
	})
})
