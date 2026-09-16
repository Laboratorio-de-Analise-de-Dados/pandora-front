import { describe, expect, it } from "vitest"
import type { PlotViewConfig } from "../../../types"
import { resolvePlotInitialConfig } from "./plotConfigMemory"

const base: PlotViewConfig = {
	xAxis: "FSC-A",
	yAxis: "SSC-A",
	xScale: "linear",
	yScale: "linear",
	xMin: "",
	xMax: "",
	yMin: "",
	yMax: "",
	cutoff: 0,
	plotMode: "heatmap",
}

const biexConfig: PlotViewConfig = { ...base, xScale: "biex", yScale: "biex" }

describe("resolvePlotInitialConfig", () => {
	it("navegação por setas carrega a config corrente, ignorando a salva", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: true,
			viewConfig: biexConfig,
			saved: base,
		})
		expect(result).toBe(biexConfig)
	})

	it("fonte já visitada restaura a última config deixada nela", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: base,
			saved: biexConfig,
			gateConfig: { xScale: "linear" },
		})
		expect(result).toBe(biexConfig)
	})

	it("1ª visita a gate usa o plot_config salvo por cima do carry-forward", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: biexConfig,
			gateConfig: { xScale: "linear", plotMode: "scatter" },
		})
		expect(result).toEqual({
			...biexConfig,
			xScale: "linear",
			plotMode: "scatter",
		})
	})

	it("1ª visita a arquivo (sem gate) herda o carry-forward", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: biexConfig,
		})
		expect(result).toEqual(biexConfig)
	})
})
