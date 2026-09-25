import { useQuery } from "@tanstack/react-query"
import { fetchDensity } from "../../../services/densityService"
import type { DensityResponse, Scale } from "../../../types"
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
	/** false = não dispara (ex.: modo edição de compensação usa a prévia). */
	enabled?: boolean
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
	enabled = true,
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
		queryFn: async () =>
			fetchDensity({
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
			}),
		enabled,
	})
}
