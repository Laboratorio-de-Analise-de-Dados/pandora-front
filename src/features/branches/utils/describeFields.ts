import { FIELD_LABELS } from "../../history/utils/describe"
import type {
	GateCoordinates,
	PlotViewConfig,
} from "../../../types/ExperimentTypes"

/**
 * Labels e valores legíveis para os campos de gate que aparecem em
 * diffs/conflitos entre linhas de análise (FE-29). Citometrista não lê
 * `gate_coordinates` nem JSON — a descrição diz o tipo de região e os
 * eixos, que é a informação útil para decidir qual versão manter.
 */

export const fieldLabel = (field: string): string =>
	FIELD_LABELS[field] ?? field

const GATE_TYPE_LABELS: Record<string, string> = {
	rectangle: "retângulo",
	polygon: "polígono",
	interval: "intervalo",
	quadrant: "quadrante",
}

const describeCoordinates = (v: GateCoordinates): string => {
	const type = GATE_TYPE_LABELS[v.type ?? "rectangle"] ?? "região"
	const axes = [v.x_axis, "y_axis" in v ? v.y_axis : undefined]
		.filter(Boolean)
		.join(" × ")
	return axes ? `${type} em ${axes}` : type
}

const PLOT_MODE_LABELS: Record<string, string> = {
	histogram: "histograma",
	scatter: "scatter",
	heatmap: "heatmap",
}

const describePlotConfig = (v: Partial<PlotViewConfig>): string => {
	const axes = [v.xAxis, v.yAxis].filter(Boolean).join(" × ")
	const mode = v.plotMode ? (PLOT_MODE_LABELS[v.plotMode] ?? v.plotMode) : null
	return [axes, mode].filter(Boolean).join(", ") || "configuração do gráfico"
}

/** Resumo legível do valor de um campo de gate (para diff/conflito). */
export const describeFieldValue = (field: string, v: unknown): string => {
	if (v == null) return "—"
	if (field === "gate_coordinates" && typeof v === "object")
		return describeCoordinates(v as GateCoordinates)
	if (field === "plot_config" && typeof v === "object")
		return describePlotConfig(v as Partial<PlotViewConfig>)
	if (typeof v === "object") return JSON.stringify(v)
	return String(v)
}
