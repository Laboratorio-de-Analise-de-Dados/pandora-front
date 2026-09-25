/**
 * FE-40 — edição de grade de compensação. Os coeficientes trafegam em
 * fração (0.052), mas o usuário edita em % (5,2) — mesma convenção da
 * grade read-only. Funções puras: nada de React/MUI aqui.
 */

const EPSILON = 1e-9

/** Grade N×N identidade — ponto de partida da criação manual. */
export const identityMatrix = (size: number): number[][] =>
	Array.from({ length: size }, (_, i) =>
		Array.from({ length: size }, (_, j) => (i === j ? 1 : 0)),
	)

/** Fração → texto da célula em % ("0.052" → "5.2"). */
export const formatPercentCell = (value: number): string =>
	(value * 100).toFixed(1)

/** Texto da célula (%) → fração. Aceita vírgula; vazio/inválido → null. */
export const parsePercentCell = (raw: string): number | null => {
	const normalized = raw.trim().replace(",", ".")
	if (!normalized) return null
	const value = Number(normalized)
	return Number.isFinite(value) ? value / 100 : null
}

/** Grade de textos → frações; null em qualquer célula inválida. */
export const parsePercentGrid = (cells: string[][]): (number | null)[][] =>
	cells.map((row) => row.map(parsePercentCell))

/** Chaves "i,j" das células com texto que não vira número finito. */
export const invalidCellKeys = (cells: string[][]): Set<string> => {
	const invalid = new Set<string>()
	cells.forEach((row, i) =>
		row.forEach((raw, j) => {
			if (parsePercentCell(raw) === null) invalid.add(`${i},${j}`)
		}),
	)
	return invalid
}

/** Chaves "i,j" das células que divergem da matriz de origem. */
export const changedCellKeys = (
	origin: number[][],
	edited: number[][],
): Set<string> => {
	const changed = new Set<string>()
	edited.forEach((row, i) =>
		row.forEach((value, j) => {
			if (Math.abs(value - (origin[i]?.[j] ?? NaN)) > EPSILON)
				changed.add(`${i},${j}`)
		}),
	)
	return changed
}
