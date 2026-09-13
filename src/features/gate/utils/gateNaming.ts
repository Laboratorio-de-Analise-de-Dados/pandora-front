/** Limite de `GateModel.name` no backend. */
export const GATE_NAME_MAX_LENGTH = 50

/**
 * Nome do próximo gate. Na raiz da amostra segue a sequência do FlowJo (`P1`,
 * `P2`, ...); dentro de um gate o nome é derivado do parent (`P1.1`, `P1.2`,
 * ...), para que o mesmo rótulo não apareça em dois níveis do mesmo ramo e a
 * seleção por nome no export deixe de ser ambígua.
 *
 * Cai de volta na sequência simples quando o prefixo estouraria o limite de
 * caracteres do backend (ramos muito profundos).
 */
export const getNextGateName = (
	existingNames: ReadonlySet<string>,
	parentName?: string,
): string => {
	const prefix = parentName ? `${parentName}.` : "P"
	const fits = prefix.length + 2 <= GATE_NAME_MAX_LENGTH
	const base = fits ? prefix : "P"
	let n = 1
	while (existingNames.has(`${base}${n}`)) n++
	return `${base}${n}`
}

/**
 * Rótulos de um grupo de quadrantes. Também derivam do parent, mantendo o
 * sufixo de eixo que identifica cada quadrante.
 */
export const getQuadrantLabels = (n: number, parentName?: string): string[] => {
	const prefix = parentName ? `${parentName}.` : ""
	return [
		`${prefix}Q${n} (X+Y+)`,
		`${prefix}Q${n} (X-Y+)`,
		`${prefix}Q${n} (X-Y-)`,
		`${prefix}Q${n} (X+Y-)`,
	]
}

export const getNextQuadrantGroup = (
	existingNames: ReadonlySet<string>,
	parentName?: string,
): number => {
	let n = 1
	while (
		getQuadrantLabels(n, parentName).some((label) => existingNames.has(label))
	)
		n++
	return n
}

/**
 * Quadrantes só ganham o prefixo do parent se todos os 4 rótulos couberem no
 * limite do backend.
 */
export const quadrantPrefixFits = (n: number, parentName?: string): boolean =>
	getQuadrantLabels(n, parentName).every(
		(label) => label.length <= GATE_NAME_MAX_LENGTH,
	)
