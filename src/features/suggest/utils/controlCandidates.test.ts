import { describe, expect, it } from "vitest"
import type { ExperimentFiles, Subsample } from "../../../types"
import { isControlFile, orderControlCandidates } from "./controlCandidates"

const mkFile = (
	id: number,
	name: string,
	extra: Partial<ExperimentFiles> = {},
): ExperimentFiles => ({
	id,
	file_name: name,
	gates: [],
	active: true,
	deactivated_at: null,
	...extra,
})

const mkSubsample = (
	id: number,
	extra: Partial<Subsample> = {},
): Subsample => ({
	id,
	name: `subsample-${id}`,
	source_path: `p/${id}`,
	active: true,
	created_at: "2026-01-01T00:00:00Z",
	files_count: 1,
	...extra,
})

describe("orderControlCandidates", () => {
	it("single_stain do canal vem primeiro para controle de fluorescência", () => {
		const subs = [
			mkSubsample(1),
			mkSubsample(2, {
				control_type: "single_stain",
				control_channel: "CD3",
			}),
		]
		const files = [
			mkFile(1, "amostra.fcs", { subsample: 1 }),
			mkFile(2, "fitc-control.fcs", { subsample: 2 }),
		]
		const ordered = orderControlCandidates(files, subs, "fluorescence", "CD3")
		expect(ordered[0].id).toBe(2)
	})

	it("unstained vem antes das comuns para controle de população", () => {
		const subs = [mkSubsample(1), mkSubsample(2, { control_type: "unstained" })]
		const files = [
			mkFile(1, "amostra.fcs", { subsample: 1 }),
			mkFile(2, "unstained.fcs", { subsample: 2 }),
		]
		const ordered = orderControlCandidates(files, subs, "population")
		expect(ordered[0].id).toBe(2)
	})

	it("tag FMO conta como controle de fluorescência", () => {
		const files = [
			mkFile(1, "amostra.fcs"),
			mkFile(2, "fmo-cd4.fcs", {
				tags: [
					{
						id: 9,
						name: "FMO",
						system_key: "fmo",
						category: "control",
						color: "#000",
						scope: "system",
						organization: null,
					},
				],
			}),
		]
		const ordered = orderControlCandidates(files, [], "fluorescence", "CD4")
		expect(ordered[0].id).toBe(2)
	})

	it("amostra inativa não entra na lista", () => {
		const files = [mkFile(1, "a.fcs"), mkFile(2, "b.fcs", { active: false })]
		expect(orderControlCandidates(files, [], "population")).toHaveLength(1)
	})
})

describe("isControlFile", () => {
	it("reconhece amostra marcada como controle", () => {
		const subs = [mkSubsample(1, { control_type: "unstained" })]
		expect(isControlFile(mkFile(1, "x.fcs", { subsample: 1 }), subs)).toBe(true)
		expect(isControlFile(mkFile(2, "y.fcs", { subsample: 2 }), subs)).toBe(
			false,
		)
	})

	it("undefined nunca é controle", () => {
		expect(isControlFile(undefined, [])).toBe(false)
	})
})
