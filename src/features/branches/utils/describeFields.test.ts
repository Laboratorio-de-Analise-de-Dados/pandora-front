import { describe, expect, it } from "vitest"
import { describeFieldValue, fieldLabel } from "./describeFields"

describe("fieldLabel", () => {
	it("traduz campos conhecidos", () => {
		expect(fieldLabel("gate_coordinates")).toBe("geometria")
		expect(fieldLabel("plot_config")).toBe("configuração do gráfico")
		expect(fieldLabel("name")).toBe("nome")
		expect(fieldLabel("color")).toBe("cor")
	})

	it("mantém chave desconhecida", () => {
		expect(fieldLabel("outro_campo")).toBe("outro_campo")
	})
})

describe("describeFieldValue", () => {
	it("descreve geometria por tipo + eixos", () => {
		expect(
			describeFieldValue("gate_coordinates", {
				type: "polygon",
				x_axis: "SSC-A",
				y_axis: "FSC-A",
				vertices: [[0, 0]],
			}),
		).toBe("polígono em SSC-A × FSC-A")
		expect(
			describeFieldValue("gate_coordinates", {
				type: "interval",
				x_axis: "FITC-A",
				startX: 0,
				endX: 1,
			}),
		).toBe("intervalo em FITC-A")
		expect(
			describeFieldValue("gate_coordinates", {
				startX: 0,
				startY: 0,
				endX: 1,
				endY: 1,
			}),
		).toBe("retângulo")
	})

	it("descreve plot_config por eixos + modo", () => {
		expect(
			describeFieldValue("plot_config", {
				xAxis: "SSC-A",
				yAxis: "FSC-A",
				plotMode: "histogram",
			}),
		).toBe("SSC-A × FSC-A, histograma")
	})

	it("devolve string crua para nome/cor e — para nulo", () => {
		expect(describeFieldValue("name", "Linfócitos")).toBe("Linfócitos")
		expect(describeFieldValue("color", "#ff0000")).toBe("#ff0000")
		expect(describeFieldValue("name", null)).toBe("—")
	})
})
