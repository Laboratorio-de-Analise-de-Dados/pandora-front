import { ExperimentFiles, Subsample } from "../../../types"

export interface SubsampleGroup {
	/** null = "Sem subsample" (arquivos na raiz do ZIP), não é um subsample real */
	subsampleId: number | null
	/** Resolvido a partir da lista da API; null quando sem subsample ou id desconhecido */
	subsample: Subsample | null
	files: ExperimentFiles[]
}

/**
 * Agrupa amostras por subsample preservando a ordem da API. O grupo
 * "Sem subsample" (id null) vai por último. Arquivo referenciando um id que não
 * veio na lista mantém grupo próprio com `subsample` null — nunca se funde com
 * "Sem subsample". Função pura (ADR-0008).
 */
export function groupFilesBySubsample(
	files: ExperimentFiles[],
	subsamples: Subsample[] = [],
): SubsampleGroup[] {
	const byId = new Map(subsamples.map((s) => [s.id, s]))
	const groups = new Map<number | null, SubsampleGroup>()
	for (const file of files) {
		const key = file.subsample ?? null
		let group = groups.get(key)
		if (!group) {
			group = {
				subsampleId: key,
				subsample: key === null ? null : (byId.get(key) ?? null),
				files: [],
			}
			groups.set(key, group)
		}
		group.files.push(file)
	}
	return [...groups.values()].sort(
		(a, b) => Number(a.subsampleId === null) - Number(b.subsampleId === null),
	)
}

/** Só renderiza o nível subsample quando existe algum de verdade. */
export function hasSubsampleLevel(groups: SubsampleGroup[]): boolean {
	return groups.some((g) => g.subsampleId !== null)
}
