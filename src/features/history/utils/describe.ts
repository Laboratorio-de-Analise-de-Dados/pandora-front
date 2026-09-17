/**
 * Converte os dicts de `would_change`/`changes` do backend (plan_revert /
 * plan_restore) em frases legíveis para os diálogos de reversão.
 * Shapes do backend (analytics/history.py, via `public_changes`):
 * - {gate_id|old_gate_id, fields}        → restaurar campos do gate
 * - {gate_id, name, op:"delete"}         → remover gate (desfazer criação)
 * - {gate_id, fields, op:"restore"}      → recriar gate substituído (apply)
 * - {old_gate_id, snapshot}              → recriar gate deletado
 * - {target_id, fields}                  → campos de amostra/subsample/experimento
 */

const FIELD_LABELS: Record<string, string> = {
	name: "nome",
	color: "cor",
	gate_coordinates: "geometria",
	plot_config: "configuração do gráfico",
	active: "ativo",
	subsample_id: "subsample",
	title: "título",
	type: "tipo",
	values: "marcadores",
	deleted_at: "arquivamento",
}

const fieldsPhrase = (fields: Record<string, unknown>): string => {
	const names = Object.keys(fields)
		.map((f) => FIELD_LABELS[f] ?? f)
		.join(", ")
	return names || "campos"
}

const nameSuffix = (change: Record<string, unknown>): string => {
	const name = change.name
	return typeof name === "string" && name ? ` "${name}"` : ""
}

/** Frase de uma linha para um item de `changes`/`would_change`. */
export const describeChange = (change: Record<string, unknown>): string => {
	const snapshot = change.snapshot as Record<string, unknown> | undefined
	if (snapshot) {
		const snapName =
			typeof snapshot.name === "string" ? ` "${snapshot.name}"` : ""
		return `Recriar gate removido${snapName}`
	}
	if (change.op === "delete") {
		return `Remover gate${nameSuffix(change)} (desfazer criação)`
	}
	if (change.op === "restore") {
		return `Restaurar gate substituído${nameSuffix(change)}`
	}
	const fields = change.fields as Record<string, unknown> | undefined
	if (fields) {
		if ("gate_id" in change || "old_gate_id" in change) {
			return `Restaurar ${fieldsPhrase(fields)} do gate${nameSuffix(change)}`
		}
		return `Restaurar ${fieldsPhrase(fields)}`
	}
	if ("gate_id" in change || "old_gate_id" in change) {
		return `Remover gate${nameSuffix(change)}`
	}
	return "Restaurar alteração"
}

/** Linha "por revisão" do plano de restore (dry-run composto). */
export const describePlanEntry = (
	entry: { revision_id: number; changes: Record<string, unknown>[] },
	summaryByRevision: Map<number, string>,
): { title: string; items: string[] } => ({
	title:
		summaryByRevision.get(entry.revision_id) ?? `Revisão #${entry.revision_id}`,
	items: entry.changes.map(describeChange),
})

/** Linha de conflito — `detail` já vem pronto do backend. */
export const describeConflict = (conflict: Record<string, unknown>): string =>
	typeof conflict.detail === "string"
		? conflict.detail
		: `Conflito na revisão #${conflict.revision_id ?? "?"}`
