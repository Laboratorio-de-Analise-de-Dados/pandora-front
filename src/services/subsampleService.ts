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
