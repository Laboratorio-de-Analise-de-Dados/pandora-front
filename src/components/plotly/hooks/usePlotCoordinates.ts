import { useCallback } from "react"

interface PlotlyAxis {
	l2p: (v: number) => number
	p2l: (v: number) => number
	_offset: number
}

function getPlotlyAxes(
	plotContainerRef: React.RefObject<HTMLDivElement | null>,
): { xax: PlotlyAxis; yax: PlotlyAxis } | null {
	const container = plotContainerRef.current
	if (!container) return null
	const plotDiv = container.querySelector(".js-plotly-plot") as HTMLElement & {
		_fullLayout?: Record<string, unknown>
	}
	if (!plotDiv?._fullLayout) return null
	const xax = plotDiv._fullLayout.xaxis as PlotlyAxis | undefined
	const yax = plotDiv._fullLayout.yaxis as PlotlyAxis | undefined
	if (!xax || !yax) return null
	return { xax, yax }
}

interface UsePlotCoordinatesReturn {
	dataToPixel: (
		dataX: number,
		dataY: number,
	) => { px: number; py: number } | null
	pixelToData: (
		px: number,
		py: number,
	) => { dataX: number; dataY: number } | null
}

export function usePlotCoordinates(
	plotContainerRef: React.RefObject<HTMLDivElement | null>,
): UsePlotCoordinatesReturn {
	const dataToPixel = useCallback(
		(dataX: number, dataY: number): { px: number; py: number } | null => {
			const axes = getPlotlyAxes(plotContainerRef)
			if (!axes) return null
			const { xax, yax } = axes
			return {
				px: xax.l2p(dataX) + xax._offset,
				py: yax.l2p(dataY) + yax._offset,
			}
		},
		[plotContainerRef],
	)

	const pixelToData = useCallback(
		(px: number, py: number): { dataX: number; dataY: number } | null => {
			const axes = getPlotlyAxes(plotContainerRef)
			if (!axes) return null
			const { xax, yax } = axes
			return {
				dataX: xax.p2l(px - xax._offset),
				dataY: yax.p2l(py - yax._offset),
			}
		},
		[plotContainerRef],
	)

	return { dataToPixel, pixelToData }
}
