import { describe, expect, it } from "vitest"
import type { ExperimentFiles } from "../types"
import {
	axisTitleLabel,
	channelDisplayLabel,
	channelLabelForFile,
} from "./channelLabel"

const file = (over: Partial<ExperimentFiles> = {}): ExperimentFiles =>
	({
		id: 1,
		file_name: "a.fcs",
		gates: [],
		active: true,
		deactivated_at: null,
		channel_meta: [{ name: "FL11-A", stain: "F4/80" }, { name: "FL1-A" }],
		channel_labels: { "FL1-A": "CFSE" },
		...over,
	}) as ExperimentFiles

describe("channelDisplayLabel — precedência (FE-51)", () => {
	it("custom ganha do stain", () => {
		expect(
			channelDisplayLabel(
				"FL11-A",
				{ name: "FL11-A", stain: "F4/80" },
				"CD11b",
			),
		).toBe("FL11-A (CD11b)")
	})

	it("stain vira CRU (stain) sem custom", () => {
		expect(
			channelDisplayLabel("FL11-A", { name: "FL11-A", stain: "F4/80" }),
		).toBe("FL11-A (F4/80)")
	})

	it("sem rótulo cai no nome cru", () => {
		expect(channelDisplayLabel("FSC-A", { name: "FSC-A" })).toBe("FSC-A")
		expect(channelDisplayLabel("FSC-A")).toBe("FSC-A")
	})

	it("custom vazio/em branco cai pro stain", () => {
		expect(
			channelDisplayLabel("FL11-A", { name: "FL11-A", stain: "F4/80" }, "  "),
		).toBe("FL11-A (F4/80)")
	})
})

describe("channelLabelForFile — resolução por arquivo", () => {
	it("lê channel_labels e channel_meta do arquivo", () => {
		expect(channelLabelForFile("FL1-A", file())).toBe("FL1-A (CFSE)")
		expect(channelLabelForFile("FL11-A", file())).toBe("FL11-A (F4/80)")
		expect(channelLabelForFile("FSC-A", file())).toBe("FSC-A")
	})

	it("labels são por arquivo — outra amostra não herda", () => {
		const other = file({ channel_labels: {} })
		expect(channelLabelForFile("FL1-A", other)).toBe("FL1-A")
	})
})

describe("axisTitleLabel — rótulo + escala no mesmo parêntese", () => {
	it("label e escala não-linear dividem os parênteses", () => {
		expect(axisTitleLabel("FL11-A", file(), "biex")).toBe(
			"FL11-A (F4/80 · biex)",
		)
	})

	it("sem label, escala segue o formato atual", () => {
		expect(axisTitleLabel("FSC-A", file(), "biex")).toBe("FSC-A (biex)")
		expect(axisTitleLabel("FSC-A", file(), "linear")).toBe("FSC-A")
	})
})
