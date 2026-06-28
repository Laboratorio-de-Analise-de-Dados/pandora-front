/** Formata percentual no estilo FlowJo/Cytobank (2 casas decimais). */
export const fmtPct = (v: number | undefined): string =>
	v != null ? `${(v * 100).toFixed(2)}%` : "–"
