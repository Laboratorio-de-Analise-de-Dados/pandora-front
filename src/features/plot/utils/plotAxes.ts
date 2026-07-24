import type { Scale } from "../../../types"
import { biex } from "./biex"
import { LINEAR_SLIDER_MAX } from "./sliders"

/**
 * Calcula o range de um eixo a partir dos limites informados (string vazia =
 * sem limite → range padrão), aplicando biex quando a escala for biexponencial.
 */
export const buildAxisRange = (
	min: string,
	max: string,
	scale: Scale,
	cof: number,
): number[] => {
	const defaultRange =
		scale === "biex"
			? [biex(-100000, cof), biex(1000000, cof)]
			: [0, LINEAR_SLIDER_MAX]
	if (min === "" || max === "") return defaultRange
	return scale === "biex"
		? [biex(parseFloat(min), cof), biex(parseFloat(max), cof)]
		: [parseFloat(min), parseFloat(max)]
}
