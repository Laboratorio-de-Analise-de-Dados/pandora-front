import type { ExperimentFiles, Gate, NewGate } from "../../../types"
import { getNextGateName } from "./gateNaming"
import { collectAllGates } from "./gateTreeHelpers"

export type DrilldownTarget =
	{ kind: "navigate"; gate: Gate } | { kind: "create"; gate: NewGate }

/**
 * FE-52: duplo clique sobre um gate — "entrar no gate" (modelo FlowJo).
 * Com filho existente navega para o primeiro; sem filho monta o NewGate
 * que nasce como **cópia do pai** (cobre a população inteira) — o refino
 * depois é pelas ferramentas de gate já existentes.
 */
export const drilldownTarget = (
	gate: Gate,
	file: ExperimentFiles,
): DrilldownTarget => {
	const child = collectAllGates(file.gates).find((g) => g.parent_id === gate.id)
	if (child) return { kind: "navigate", gate: child }

	const gc = gate.gate_coordinates
	const xAxis = "x_axis" in gc ? (gc.x_axis ?? "FSC-A") : "FSC-A"
	const yAxis = "y_axis" in gc ? (gc.y_axis ?? "SSC-A") : "SSC-A"
	const names = new Set(collectAllGates(file.gates).map((g) => g.name))
	return {
		kind: "create",
		gate: {
			file_data: file.id,
			name: getNextGateName(names, gate.name),
			parent: gate.id,
			gate_coordinates: gate.gate_coordinates,
			dashboard: {
				name: `${xAxis} X ${yAxis}`,
				dashboard_config: {
					x_axis_label: xAxis,
					y_axis_label: yAxis,
				},
				file_data: file.id,
			},
		},
	}
}
