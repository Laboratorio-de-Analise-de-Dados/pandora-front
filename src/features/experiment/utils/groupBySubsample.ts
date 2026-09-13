import { ExperimentFiles, Subsample } from "../../../types"

export interface SubsampleGroup {
	/** null = "Sem subsample" (arquivos na raiz do ZIP), não é um subsample real */
	subsample: Subsample | null
	files: ExperimentFiles[]
}

/**
 * Agrupa amostras por subsample preservando a ordem da API. O grupo
 * "Sem subsample" (null) vai por último. Função pura — a API ainda não envia
 * `subsample`, então tudo cai no grupo null até o BE-07.
 */
export function groupFilesBySubsample(
	files: ExperimentFiles[],
): SubsampleGroup[] {
	const groups = new Map<number | null, SubsampleGroup>()
	for (const file of files) {
		const key = file.subsample?.id ?? null
		let group = groups.get(key)
		if (!group) {
			group = { subsample: file.subsample ?? null, files: [] }
			groups.set(key, group)
		}
		group.files.push(file)
	}
	return [...groups.values()].sort(
		(a, b) => Number(a.subsample === null) - Number(b.subsample === null),
	)
}

/** Só renderiza o nível subsample quando existe algum de verdade. */
export function hasSubsampleLevel(groups: SubsampleGroup[]): boolean {
	return groups.some((g) => g.subsample !== null)
}
