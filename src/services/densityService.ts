import CytometryApi from "../API"
import type { DensityResponse, Scale } from "../types"
import { COFACTOR } from "../features/plot/utils/biex"

export interface FetchDensityParams {
	sourceType: "file" | "gate"
	sourceId: number
	xAxis: string
	yAxis: string
	plotMode: "heatmap" | "scatter" | "histogram"
	xScale: Scale
	yScale: Scale
	cutoff: number
	xMin: string
	xMax: string
	yMin: string
	yMax: string
}

export const fetchDensity = async ({
	sourceType,
	sourceId,
	xAxis,
	yAxis,
	plotMode,
	xScale,
	yScale,
	cutoff,
	xMin,
	xMax,
	yMin,
	yMax,
}: FetchDensityParams): Promise<DensityResponse> => {
	const base =
		sourceType === "file"
			? `/experiment/file/${sourceId}`
			: `/analytics/gate/${sourceId}`

	const params =
		plotMode === "heatmap"
			? `mode=heatmap&bins=200&cutoff=${cutoff}`
			: plotMode === "histogram"
				? "mode=histogram&bins=256"
				: "mode=scatter&sample=5000"

	const scaleParams = `xscale=${xScale}&yscale=${yScale}&cofactor=${COFACTOR}`

	const rangeParams = [xMin, xMax, yMin, yMax]
		.map((value, index) => {
			const keys = ["xmin", "xmax", "ymin", "ymax"]
			return value ? `${keys[index]}=${value}` : ""
		})
		.filter(Boolean)
		.join("&")

	const qs = [params, scaleParams, rangeParams].filter(Boolean).join("&")

	const res = await CytometryApi.get<DensityResponse>(
		`${base}/density?x=${encodeURIComponent(xAxis)}&y=${encodeURIComponent(
			yAxis,
		)}&${qs}`,
	)
	return res.data
}
