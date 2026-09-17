/** Rótulos de apresentação para `org_type` vindo da API (lab, cliente…). */
export const orgTypeLabel: Record<string, string> = {
	lab: "Laboratório",
	cliente: "Cliente",
}

/** "1 experimento ativo" / "4 experimentos ativos". */
export const pluralPt = (n: number, singular: string, plural: string) =>
	`${n} ${n === 1 ? singular : plural}`
