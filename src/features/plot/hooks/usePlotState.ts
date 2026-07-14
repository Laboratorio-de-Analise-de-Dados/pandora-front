import { useState } from "react"
import type { PlotMode, Scale } from "../../../types"
import { defaultScale } from "../utils/biex"

export type { PlotMode } from "../../../types"
export type GateTool = "rect" | "poly" | "quad" | "edit"

export interface PlotState {
	xAxis: string
	yAxis: string
	plotMode: PlotMode
	tool: GateTool
	xScale: Scale
	yScale: Scale
	cutoff: number
	xMin: string
	xMax: string
	yMin: string
	yMax: string
}

export interface PlotStateActions {
	setXAxis: (v: string) => void
	setYAxis: (v: string) => void
	setPlotMode: (m: PlotMode) => void
	setTool: (t: GateTool) => void
	setXScale: (s: Scale) => void
	setYScale: (s: Scale) => void
	setCutoff: (c: number) => void
	setXMin: (v: string) => void
	setXMax: (v: string) => void
	setYMin: (v: string) => void
	setYMax: (v: string) => void
	handleSelectX: (value: string) => void
	handleSelectY: (value: string) => void
}

export function usePlotState(): PlotState & PlotStateActions {
	const [xAxis, setXAxis] = useState("FSC-A")
	const [yAxis, setYAxis] = useState("SSC-A")
	const [plotMode, setPlotMode] = useState<PlotMode>("scatter")
	const [tool, setTool] = useState<GateTool>("rect")
	const [xScale, setXScale] = useState<Scale>(defaultScale("FSC-A"))
	const [yScale, setYScale] = useState<Scale>(defaultScale("SSC-A"))
	const [cutoff, setCutoff] = useState(0)
	const [xMin, setXMin] = useState("")
	const [xMax, setXMax] = useState("")
	const [yMin, setYMin] = useState("")
	const [yMax, setYMax] = useState("")

	const handleSelectX = (value: string) => {
		setXAxis(value)
		setXScale(defaultScale(value))
	}

	const handleSelectY = (value: string) => {
		setYAxis(value)
		setYScale(defaultScale(value))
	}

	return {
		xAxis, yAxis, plotMode, tool, xScale, yScale, cutoff,
		xMin, xMax, yMin, yMax,
		setXAxis, setYAxis, setPlotMode, setTool, setXScale, setYScale,
		setCutoff, setXMin, setXMax, setYMin, setYMax,
		handleSelectX, handleSelectY,
	}
}
