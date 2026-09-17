import { expect, test } from "vitest"
import { filterExperiments } from "./filterExperiments"
import type { Experiment } from "../../types"

const base: Experiment = {
	id: 0,
	title: "",
	type: "CBA",
	values: [],
	active: true,
	organization: null,
	created_by: 1,
}

const experiments: Experiment[] = [
	{
		...base,
		id: 1,
		title: "Painel T-Cell Q3",
		organization: { id: 5, name: "LIMC-IA", org_type: "lab" },
	},
	{
		...base,
		id: 2,
		title: "CBA citocinas",
		organization: { id: 5, name: "LIMC-IA", org_type: "lab" },
	},
	{ ...base, id: 3, title: "Rascunho pessoal" },
	{
		...base,
		id: 4,
		title: "Painel B-Cell",
		organization: { id: 9, name: "Outro Lab", org_type: "lab" },
	},
]

test("sem orgId retorna todos os experimentos", () => {
	expect(filterExperiments(experiments, null, "")).toHaveLength(4)
})

test("orgId=0 retorna só experimentos pessoais", () => {
	const result = filterExperiments(experiments, 0, "")
	expect(result.map((e) => e.id)).toEqual([3])
})

test("orgId filtra pelo id da organização", () => {
	const result = filterExperiments(experiments, 5, "")
	expect(result.map((e) => e.id)).toEqual([1, 2])
})

test("busca filtra por título ignorando case e espaços", () => {
	expect(
		filterExperiments(experiments, null, "  PAINEL ").map((e) => e.id),
	).toEqual([1, 4])
})

test("busca combina com filtro de organização", () => {
	expect(filterExperiments(experiments, 5, "cba").map((e) => e.id)).toEqual([2])
})

test("busca sem correspondência retorna lista vazia", () => {
	expect(filterExperiments(experiments, null, "inexistente")).toHaveLength(0)
})
