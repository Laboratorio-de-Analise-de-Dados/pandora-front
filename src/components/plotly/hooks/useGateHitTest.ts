import { useCallback } from "react"
import type { Gate, Scale } from "../../../types"
import type { GateShape } from "../../../features/plot/hooks/useGateShapes"
import { isPointInGate } from "../../../features/plot/utils/gateHitTest"

interface PlotlyAxis {
	p2d: (v: number) => number
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

interface UseGateHitTestParams {
	plotContainerRef: React.RefObject<HTMLDivElement | null>
	gateShapes: GateShape[]
	childGates: Gate[]
	effXScale: Scale
	effYScale: Scale
}

interface GateHit {
	gate: Gate
	gateIndex: number
	swapped: boolean
}

export function useGateHitTest({
	plotContainerRef,
	gateShapes,
	childGates,
	effXScale,
	effYScale,
}: UseGateHitTestParams) {
	const findGateAtPoint = useCallback(
		(clientX: number, clientY: number): GateHit | null => {
			const axes = getPlotlyAxes(plotContainerRef)
			if (!axes) return null

			const container = plotContainerRef.current
			if (!container) return null
			const plotEl = container.querySelector(".js-plotly-plot")
			if (!plotEl) return null
			const rect = plotEl.getBoundingClientRect()

			const px = clientX - rect.left
			const py = clientY - rect.top
			const { xax, yax } = axes
			const dataX = xax.p2d(px - xax._offset)
			const dataY = yax.p2d(py - yax._offset)
			if (dataX == null || dataY == null) return null

			for (const shape of gateShapes) {
				if (!shape._gateData) continue
				const gc = shape._gateData.gate_coordinates
				const swapped = shape._swapped ?? false
				if (isPointInGate(dataX, dataY, gc, swapped, effXScale, effYScale)) {
					const idx = childGates.findIndex((g) => g.id === shape._gateData.id)
					return {
						gate: shape._gateData,
						gateIndex: idx < 0 ? 0 : idx,
						swapped,
					}
				}
			}
			return null
		},
		[plotContainerRef, gateShapes, childGates, effXScale, effYScale],
	)

	const findGateAtDataPoint = useCallback(
		(
			dataX: number,
			dataY: number,
			filter?: (gate: Gate) => boolean,
		): GateHit | null => {
			for (const shape of gateShapes) {
				if (!shape._gateData) continue
				if (filter && !filter(shape._gateData)) continue
				const gc = shape._gateData.gate_coordinates
				const swapped = shape._swapped ?? false
				if (isPointInGate(dataX, dataY, gc, swapped, effXScale, effYScale)) {
					const idx = childGates.findIndex((g) => g.id === shape._gateData.id)
					return {
						gate: shape._gateData,
						gateIndex: idx < 0 ? 0 : idx,
						swapped,
					}
				}
			}
			return null
		},
		[gateShapes, childGates, effXScale, effYScale],
	)

	return { findGateAtPoint, findGateAtDataPoint }
}
