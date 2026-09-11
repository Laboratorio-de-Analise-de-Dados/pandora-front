import type { ExperimentFiles, Gate } from "../../../types"
import { collectAllGates } from "../../gate/utils"

export interface SelectableItem {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
	path: string
	/** Caminho do gate dentro do arquivo, ex: "P1 > P1.1". */
	gatePath: string
	/**
	 * Chave de equivalência entre amostras: a linhagem de cópias quando ela
	 * existe (`family:<id do original>`) ou o caminho de nomes para gates
	 * criados manualmente/legados (`path:<P1 > P1.1>`).
	 */
	groupKey: string
	depth: number
	color?: string | null
}

/** Constrói a lista achatada (arquivos + gates) usada nos seletores. */
export const buildSelectableItems = (
	files: ExperimentFiles[],
): SelectableItem[] => {
	const allGates = files.flatMap((f) => collectAllGates(f.gates))
	const byId = new Map(allGates.map((g) => [g.id, g]))
	const isOriginal = new Set(
		allGates
			.map((g) => g.copied_from_id)
			.filter((id): id is number => Boolean(id)),
	)

	const familyRootId = (gateId: number): number => {
		const visited = new Set<number>()
		let current = gateId
		while (!visited.has(current)) {
			visited.add(current)
			const copiedFrom = byId.get(current)?.copied_from_id
			if (!copiedFrom) break
			current = copiedFrom
		}
		return current
	}

	const groupKeyFor = (gate: Gate, gatePath: string): string =>
		gate.copied_from_id || isOriginal.has(gate.id)
			? `family:${familyRootId(gate.id)}`
			: `path:${gatePath}`

	const items: SelectableItem[] = []
	for (const f of files) {
		items.push({
			type: "file",
			id: f.id,
			name: f.file_name,
			fileDataId: f.id,
			path: f.file_name,
			gatePath: "",
			groupKey: `file:${f.id}`,
			depth: 0,
		})
		const addGates = (
			gates: Gate[],
			parentPath: string,
			parentGatePath: string,
			fileDataId: number,
			depth: number,
		) => {
			for (const g of gates) {
				const p = `${parentPath} > ${g.name}`
				const gatePath = parentGatePath
					? `${parentGatePath} > ${g.name}`
					: g.name
				items.push({
					type: "gate",
					id: g.id,
					name: g.name,
					fileDataId,
					path: p,
					gatePath,
					groupKey: groupKeyFor(g, gatePath),
					depth,
					color: g.color,
				})
				if (g.children)
					addGates(g.children, p, gatePath, fileDataId, depth + 1)
			}
		}
		addGates(f.gates, f.file_name, "", f.id, 1)
	}
	return items
}
