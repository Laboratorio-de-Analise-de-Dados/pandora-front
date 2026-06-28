import { useQuery } from "@tanstack/react-query"
import CytometryApi from "../../../API"
import type { DensityResponse, Scale } from "../../../types"
import { COFACTOR } from "../utils/biex"
import type { PlotMode } from "./usePlotState"

interface UseDensityQueryParams {
	sourceType: "file" | "gate"
	sourceId: number
	xAxis: string
	yAxis: string
	plotMode: PlotMode
	xScale: Scale
	yScale: Scale
	cutoff: number
	xMin: string
	xMax: string
	yMin: string
	yMax: string
}

export function useDensityQuery({
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
}: UseDensityQueryParams) {
	return useQuery<DensityResponse>({
		queryKey: [
			"density",
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
		],
		queryFn: async () => {
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
			const rangeParams = [
				xMin ? `xmin=${xMin}` : "",
				xMax ? `xmax=${xMax}` : "",
				yMin ? `ymin=${yMin}` : "",
				yMax ? `ymax=${yMax}` : "",
			]
				.filter(Boolean)
				.join("&")
			const qs = [params, scaleParams, rangeParams]
				.filter(Boolean)
				.join("&")
			const res = await CytometryApi.get<DensityResponse>(
				`${base}/density?x=${encodeURIComponent(
					xAxis,
				)}&y=${encodeURIComponent(yAxis)}&${qs}`,
			)
			return res.data
		},
	})
}
