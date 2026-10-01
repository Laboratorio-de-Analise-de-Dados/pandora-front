import type { ExperimentFiles, Subsample } from "../../../types"
import type { FigureGroup } from "../../../services/figureService"

/**
 * Preset "agrupar por subsample": materializa os subsamples ativos como
 * grupos da figura (grupos são por figura — o vínculo é só uma sugestão
 * inicial, edições depois não mexem no subsample). Amostras sem subsample
 * caem num grupo final "Sem subsample" para não sumirem silenciosamente.
 */
export const groupsFromSubsamples = (
	files: ExperimentFiles[],
	subsamples: Subsample[],
): FigureGroup[] => {
	const groups: FigureGroup[] = subsamples
		.filter((s) => s.active !== false)
		.map((s) => ({
			name: s.name,
			file_data_ids: files
				.filter((f) => f.subsample === s.id && f.active !== false)
				.map((f) => f.id),
		}))
		.filter((g) => g.file_data_ids.length > 0)
	const assigned = new Set(groups.flatMap((g) => g.file_data_ids))
	const rest = files
		.filter((f) => f.active !== false && !assigned.has(f.id))
		.map((f) => f.id)
	if (rest.length) groups.push({ name: "Sem subsample", file_data_ids: rest })
	return groups
}

/** Caminhos de nomes de todos os gates da árvore ("Pai/Filho"), na ordem. */
const collectPathNames = (
	gates: ExperimentFiles["gates"],
	prefix: string[] = [],
): string[] => {
	const paths: string[] = []
	for (const g of gates) {
		const path = [...prefix, g.name]
		paths.push(path.join("/"))
		if (g.children?.length) paths.push(...collectPathNames(g.children, path))
	}
	return paths
}

/**
 * União ordenada dos caminhos de população presentes nas amostras dadas —
 * as opções do seletor de populações do editor. `"."` (amostra inteira) é
 * sempre oferecido como primeira opção.
 */
export const availablePopulationPaths = (
	files: ExperimentFiles[],
	fileIds: number[],
): string[] => {
	const seen = new Set<string>()
	for (const f of files) {
		if (!fileIds.includes(f.id)) continue
		for (const p of collectPathNames(f.gates)) seen.add(p)
	}
	return [...seen]
}
