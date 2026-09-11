import type { Gate } from "../../../types"

/**
 * Texto de autoria mostrado no hover da árvore. Retorna null para gates
 * criados antes do registro de autor, para não exibir tooltip vazio.
 */
export const gateAuthorLabel = (gate: Gate): string | null => {
	const author = gate.created_by_name?.trim()
	const createdAt = gate.created_at ? new Date(gate.created_at) : null
	const date =
		createdAt && !Number.isNaN(createdAt.getTime())
			? createdAt.toLocaleDateString("pt-BR")
			: null

	if (!author) return date ? `Criado em ${date}` : null
	return date ? `Criado por ${author} em ${date}` : `Criado por ${author}`
}
