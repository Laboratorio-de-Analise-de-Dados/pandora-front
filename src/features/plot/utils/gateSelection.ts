/**
 * Fração mínima do range do eixo que uma seleção precisa cobrir para virar gate.
 * Abaixo disso tratamos como clique/arraste acidental, não como retângulo.
 */
export const MIN_SELECTION_FRACTION = 0.01

/** Extensão da seleção em relação ao range exibido do eixo (0 a 1). */
export const selectionSpanFraction = (
	from: number,
	to: number,
	axisRange: number[],
): number => {
	const axisSpan = Math.abs(axisRange[1] - axisRange[0])
	if (!Number.isFinite(axisSpan) || axisSpan === 0) return 0
	return Math.abs(to - from) / axisSpan
}

/**
 * Seleção degenerada: clique sem arraste ou arraste tão pequeno que o gate sairia
 * vazio. Avaliado no espaço exibido, então vale para linear e biex.
 */
export const isDegenerateSelection = (
	from: number,
	to: number,
	axisRange: number[],
): boolean =>
	selectionSpanFraction(from, to, axisRange) < MIN_SELECTION_FRACTION
