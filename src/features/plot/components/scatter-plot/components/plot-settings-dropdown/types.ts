import type { Scale } from "../../../../../../types"
import type { PlotMode } from "../../../../hooks/usePlotState"

export interface PlotSettingsDropdownProps {
	plotMode: PlotMode
	xScale: Scale
	yScale: Scale
	cutoff: number
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	onXScaleChange: (s: Scale) => void
	onYScaleChange: (s: Scale) => void
	onCutoffChange: (c: number) => void
	onXMinChange: (v: string) => void
	onXMaxChange: (v: string) => void
	onYMinChange: (v: string) => void
	onYMaxChange: (v: string) => void
}

export interface ScaleSelectorProps {
	xScale: Scale
	yScale: Scale
	plotMode: PlotMode
	onXScaleChange: (s: Scale) => void
	onYScaleChange: (s: Scale) => void
}

export interface AxisRangeSelectorProps {
	label: string
	scale: Scale
	min: string
	max: string
	onMinChange: (v: string) => void
	onMaxChange: (v: string) => void
	setIsAdjusting: (b: boolean) => void
}

export interface PlotSettingsDropdownProps {
	plotMode: PlotMode
	xScale: Scale
	yScale: Scale
	cutoff: number
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	onXScaleChange: (s: Scale) => void
	onYScaleChange: (s: Scale) => void
	onCutoffChange: (c: number) => void
	onXMinChange: (v: string) => void
	onXMaxChange: (v: string) => void
	onYMinChange: (v: string) => void
	onYMaxChange: (v: string) => void
}
