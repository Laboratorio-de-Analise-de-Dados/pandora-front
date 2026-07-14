import type { PlotMode, GateTool } from "../../../../hooks/usePlotState"
export interface PlotToolbarProps {
	tool: GateTool
	plotMode: PlotMode
	onToolChange: (tool: GateTool) => void
	onPlotModeChange: (mode: PlotMode) => void
	onRecompute: () => void
	isRecomputing: boolean
}
