import { describe, expect, it } from "vitest"
import type { GateSuggestion, SuggestionRun } from "../../../types"
import {
	activeRunsForContext,
	latestEmptyRun,
	pendingSuggestionsForContext,
} from "./contextFilter"

const mkSuggestion = (
	id: number,
	accepted: boolean | null = null,
): GateSuggestion => ({
	id,
	run: 1,
	gate_coordinates: {
		type: "polygon",
		x_axis: "FSC-A",
		y_axis: "SSC-A",
		vertices: [
			[0, 0],
			[1, 0],
			[1, 1],
		],
	},
	accepted,
})

const mkRun = (partial: Partial<SuggestionRun> = {}): SuggestionRun => ({
	id: 1,
	file_data: 10,
	parent: null,
	channels: ["FSC-A", "SSC-A"],
	intent: "separate",
	gate_type: "polygon",
	status: "done",
	suggestions: [],
	...partial,
})

describe("pendingSuggestionsForContext", () => {
	it("filtra por amostra + pai + canais e só retorna pendentes", () => {
		const runs = [
			mkRun({
				suggestions: [
					mkSuggestion(1),
					mkSuggestion(2, true),
					mkSuggestion(3, false),
				],
			}),
			mkRun({ id: 2, parent: 5, suggestions: [mkSuggestion(4)] }), // outro pai
			mkRun({
				id: 3,
				channels: ["CD3", "CD4"],
				suggestions: [mkSuggestion(5)],
			}), // outros canais
			mkRun({ id: 4, file_data: 11, suggestions: [mkSuggestion(6)] }), // outro arquivo
		]
		const pending = pendingSuggestionsForContext(
			runs,
			10,
			null,
			"FSC-A",
			"SSC-A",
		)
		expect(pending.map((c) => c.suggestion.id)).toEqual([1])
	})

	it("canais invertidos também casam (X/Y equivalentes)", () => {
		const runs = [
			mkRun({
				channels: ["SSC-A", "FSC-A"],
				suggestions: [mkSuggestion(7)],
			}),
		]
		expect(
			pendingSuggestionsForContext(runs, 10, null, "FSC-A", "SSC-A"),
		).toHaveLength(1)
	})
})

describe("activeRunsForContext", () => {
	it("só pending/processing contam como ativos", () => {
		const runs = [
			mkRun({ id: 1, status: "pending" }),
			mkRun({ id: 2, status: "processing" }),
			mkRun({ id: 3, status: "done" }),
			mkRun({ id: 4, status: "error" }),
		]
		expect(
			activeRunsForContext(runs, 10, null, "FSC-A", "SSC-A").map((r) => r.id),
		).toEqual([1, 2])
	})
})

describe("latestEmptyRun", () => {
	it("run concluído sem candidatas pendentes é o feedback honesto", () => {
		const runs = [
			mkRun({
				id: 1,
				status: "done",
				suggestions: [],
				created_at: "2026-01-01T00:00:00Z",
			}),
			mkRun({
				id: 2,
				status: "done",
				suggestions: [mkSuggestion(8)],
				created_at: "2026-01-02T00:00:00Z",
			}),
		]
		expect(latestEmptyRun(runs, 10, null, "FSC-A", "SSC-A")?.id).toBe(1)
	})
})
