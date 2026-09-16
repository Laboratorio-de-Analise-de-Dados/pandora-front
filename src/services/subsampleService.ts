import CytometryApi from "../API"
import type { Subsample } from "../types"

export const fetchSubsamples = async (
	experimentId: string,
	includeInactive = false,
): Promise<Subsample[]> => {
	const res = await CytometryApi.get(
		`/experiment/${experimentId}/subsamples/`,
		{
			params: includeInactive ? { include_inactive: "true" } : undefined,
		},
	)
	return res.data
}

export const createSubsample = async (
	experimentId: string,
	name: string,
): Promise<Subsample> => {
	const res = await CytometryApi.post(
		`/experiment/${experimentId}/subsamples/`,
		{ name },
	)
	return res.data
}

export const renameSubsample = async (
	experimentId: string,
	subsampleId: number,
	name: string,
): Promise<Subsample> => {
	const res = await CytometryApi.patch(
		`/experiment/${experimentId}/subsamples/${subsampleId}/`,
		{ name },
	)
	return res.data
}

/**
 * Marca/desmarca o subsample como controle de compensação (BE-22,
 * ADR-0019): `null` limpa; `unstained` é o negativo; `single_stain`
 * exige `control_channel` (canal fluorescente).
 */
export const updateSubsampleControl = async (
	experimentId: string,
	subsampleId: number,
	payload: {
		control_type: "unstained" | "single_stain" | null
		control_channel?: string
	},
): Promise<Subsample> => {
	const res = await CytometryApi.patch(
		`/experiment/${experimentId}/subsamples/${subsampleId}/`,
		payload,
	)
	return res.data
}

/** Inativa o subsample e desvincula as amostras (nada é apagado — ADR-0005). */
export const archiveSubsample = async (
	experimentId: string,
	subsampleId: number,
): Promise<void> => {
	await CytometryApi.delete(
		`/experiment/${experimentId}/subsamples/${subsampleId}/`,
	)
}

export const moveFileToSubsample = async (
	fileDataId: number,
	subsampleId: number | null,
): Promise<void> => {
	await CytometryApi.patch(`/experiment/file/${fileDataId}/subsample`, {
		subsample: subsampleId,
	})
}
