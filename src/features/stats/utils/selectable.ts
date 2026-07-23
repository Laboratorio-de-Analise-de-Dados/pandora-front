import type { ExperimentFiles, Gate } from "../../../types"

export interface SelectableItem {
	type: "file" | "gate"
	id: number
	name: string
	fileDataId: number
	path: string
	depth: number
	color?: string | null
}

/** Constrói a lista achatada (arquivos + gates) usada nos seletores. */
export const buildSelectableItems = (
	files: ExperimentFiles[],
): SelectableItem[] => {
	const items: SelectableItem[] = []
	for (const f of files) {
		items.push({
			type: "file",
			id: f.id,
			name: f.file_name,
			fileDataId: f.id,
			path: f.file_name,
			depth: 0,
		})
		const addGates = (
			gates: Gate[],
			parentPath: string,
			fileDataId: number,
			depth: number,
		) => {
			for (const g of gates) {
				const p = `${parentPath} > ${g.name}`
				items.push({
					type: "gate",
					id: g.id,
					name: g.name,
					fileDataId,
					path: p,
					depth,
					color: g.color,
				})
				if (g.children) addGates(g.children, p, fileDataId, depth + 1)
			}
		}
		addGates(f.gates, f.file_name, f.id, 1)
	}
	return items
}
