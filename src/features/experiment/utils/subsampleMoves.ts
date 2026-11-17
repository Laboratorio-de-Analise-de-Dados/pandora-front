import type { ExperimentFiles } from "../../../types"

export interface SubsampleMove {
	file_id: number
	subsample: number | null
}

/**
 * FE-53 (BE-48): payload do `PATCH /experiment/<id>/files/subsample`
 * montado da seleção — `subsample` é o id destino ou `null`
 * (desagrupar). Retorna `null` quando nada muda: no-op honesto, sem
 * request (padrão do mover singular).
 */
export const buildSubsampleMoves = (
	files: Pick<ExperimentFiles, "id" | "subsample">[],
	fileIds: readonly number[],
	subsampleId: number | null,
): { moves: SubsampleMove[] } | null => {
	const ids = new Set(fileIds)
	const moves = files
		.filter((f) => ids.has(f.id))
		.filter((f) => (f.subsample ?? null) !== subsampleId)
		.map((f) => ({ file_id: f.id, subsample: subsampleId }))
	return moves.length > 0 ? { moves } : null
}
