import { describe, expect, it } from "vitest"
import type { PlotViewConfig } from "../../../types"
import {
	resolvePlotInitialConfig,
	type ChannelMemory,
} from "./plotConfigMemory"

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
			persistedConfig: { xScale: "linear" },
		})
		expect(result).toBe(biexConfig)
	})

	it("1ª visita a gate usa o plot_config salvo por cima do carry-forward", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: biexConfig,
			persistedConfig: { xScale: "linear", plotMode: "scatter" },
		})
		expect(result).toEqual({
			...biexConfig,
			xScale: "linear",
			plotMode: "scatter",
		})
	})

	it("1ª visita a amostra raiz também honra o plot_config persistido", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: biexConfig,
			persistedConfig: { xScale: "linear" },
		})
		expect(result).toEqual({ ...biexConfig, xScale: "linear" })
	})

	it("1ª visita a arquivo sem config salva herda o carry-forward", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: biexConfig,
		})
		expect(result).toEqual(biexConfig)
	})
})

describe("memória por canal (FE-48)", () => {
	const channelMemory: ChannelMemory = {
		"FL1-A": { scale: "log", min: "1", max: "10000" },
	}
	const fl1View: PlotViewConfig = { ...base, xAxis: "FL1-A" }

	it("canal com memória aplica escala/range na 1ª visita a outra fonte", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: fl1View,
			channelMemory,
		})
		expect(result.xScale).toBe("log")
		expect(result.xMin).toBe("1")
		expect(result.xMax).toBe("10000")
		// SSC-A (y) não tem memória — mantém o carry-forward.
		expect(result.yScale).toBe("linear")
	})

	it("saved da fonte ganha da memória de canal", () => {
		const saved: PlotViewConfig = { ...fl1View, xScale: "biex" }
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: fl1View,
			saved,
			channelMemory,
		})
		expect(result).toBe(saved)
	})

	it("memória de canal ganha do plot_config persistido da fonte", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: fl1View,
			persistedConfig: { xScale: "linear" },
			channelMemory,
		})
		expect(result.xScale).toBe("log")
	})

	it("navegação por setas ignora a memória de canal", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: true,
			viewConfig: fl1View,
			channelMemory,
		})
		expect(result).toBe(fl1View)
	})

	it("canal sem memória cai no comportamento atual", () => {
		const result = resolvePlotInitialConfig({
			keepCurrent: false,
			viewConfig: base,
			channelMemory,
		})
		expect(result).toEqual(base)
	})
})
