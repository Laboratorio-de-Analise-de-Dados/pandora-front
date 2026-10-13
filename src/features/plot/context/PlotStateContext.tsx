import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { ChannelMeta, PlotViewConfig } from "../../../types"
import {
	usePlotState,
	type PlotState,
	type PlotStateActions,
} from "../hooks/usePlotState"
import { usePlotPersistence } from "../hooks/usePlotPersistence"

interface PlotStateContextValue extends PlotState, PlotStateActions {
	/** Configuração corrente como objeto, pronta para persistir/serializar. */
	config: PlotViewConfig
}

const PlotStateContext = createContext<PlotStateContextValue | undefined>(
	undefined,
)

interface PlotStateProviderProps {
	children: ReactNode
	initialConfig?: Partial<PlotViewConfig>
	/** Metadados por canal do arquivo FCS — alimentam o default de
	 *  escala/range ao trocar de eixo (FE-44). */
	channelMeta?: ChannelMeta[]
	sourceType: "file" | "gate"
	sourceId: number
	onPersist: (
		sourceType: "file" | "gate",
		sourceId: number,
		config: PlotViewConfig,
	) => void
}

export function PlotStateProvider({
	children,
	initialConfig,
	channelMeta,
	sourceType,
	sourceId,
	onPersist,
}: PlotStateProviderProps) {
	const plotState = usePlotState(initialConfig, channelMeta)

	const config = useMemo<PlotViewConfig>(
		() => ({
			xAxis: plotState.xAxis,
			yAxis: plotState.yAxis,
			xScale: plotState.xScale,
			yScale: plotState.yScale,
			xMin: plotState.xMin,
			xMax: plotState.xMax,
			yMin: plotState.yMin,
			yMax: plotState.yMax,
			cutoff: plotState.cutoff,
			plotMode: plotState.plotMode,
		}),
		[
			plotState.xAxis,
			plotState.yAxis,
			plotState.xScale,
			plotState.yScale,
			plotState.xMin,
			plotState.xMax,
			plotState.yMin,
			plotState.yMax,
			plotState.cutoff,
			plotState.plotMode,
		],
	)

	usePlotPersistence({ sourceType, sourceId, config, onPersist })

	const value = useMemo(() => ({ ...plotState, config }), [plotState, config])

	return (
		<PlotStateContext.Provider value={value}>
			{children}
		</PlotStateContext.Provider>
	)
}

export function usePlotContext(): PlotStateContextValue {
	const ctx = useContext(PlotStateContext)
	if (!ctx) {
		throw new Error("usePlotContext must be used within a PlotStateProvider")
	}
	return ctx
}
