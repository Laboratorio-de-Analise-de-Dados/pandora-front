import CytometryApi from "../API"

/**
 * Branches de análise (BE-23, ADR-0020): linhas materializadas de gates
 * dentro do mesmo experimento. Fork copia a árvore da base; merge filha
 * → base com resolução de conflitos por chave.
 */
export interface AnalysisBranch {
	id: number
	name: string
	is_main: boolean
	base_branch: number | null
	created_by_name: string | null
	gates_count: number
	created_at: string
}

export const fetchBranches = async (
	experimentId: number,
): Promise<AnalysisBranch[]> => {
	const res = await CytometryApi.get(
		`/analytics/experiment/${experimentId}/branches/`,
	)
	return res.data.results
}

export const createBranch = async (
	experimentId: number,
	name: string,
	baseBranchId?: number | null,
): Promise<AnalysisBranch> => {
	const res = await CytometryApi.post(
		`/analytics/experiment/${experimentId}/branches/`,
		{ name, ...(baseBranchId != null ? { base_branch_id: baseBranchId } : {}) },
	)
	return res.data
}

export const renameBranch = async (id: number, name: string): Promise<void> => {
	await CytometryApi.patch(`/analytics/branches/${id}/`, { name })
}

/** Arquivar = DELETE lógico; a main devolve 400 (o backend protege). */
export const archiveBranch = async (id: number): Promise<void> => {
	await CytometryApi.delete(`/analytics/branches/${id}/`)
}

export interface BranchDiffChange {
	type: "create" | "update" | "delete"
	source_gate_id?: number
	target_gate_id?: number
	file_data_id?: number | null
	file_name?: string | null
	parent_name?: string | null
	name: string
	fields?: Record<string, unknown>
}

export interface BranchConflictField {
	base: unknown
	target: unknown
	source: unknown
}

export interface BranchDiffConflict {
	/** "f:<gate_id>" editado nos dois lados; "dt:" existe só na branch;
	 * "ds:" excluído na branch mas editado na base. */
	key: string
	type:
		"modified_both" | "deleted_in_target" | "edited_in_target_deleted_in_source"
	source_gate_id?: number
	target_gate_id?: number
	file_data_id?: number | null
	name: string
	fields?: Record<string, BranchConflictField>
	auto_fields?: Record<string, unknown>
	detail: string
}

export interface BranchDiff {
	source: { id: number; name: string }
	target: { id: number; name: string }
	changes: BranchDiffChange[]
	conflicts: BranchDiffConflict[]
}

export const fetchBranchDiff = async (
	branchId: number,
): Promise<BranchDiff> => {
	const res = await CytometryApi.get(`/analytics/branches/${branchId}/diff/`)
	return res.data
}

/** Resolução por conflito: `mine` mantém a base, `theirs` usa a branch,
 * `both` preserva a base e cria a versão da branch renomeada (só `f:`). */
export type MergeResolution = "mine" | "theirs" | "both"

export interface MergeResult {
	merged: boolean
	applied: unknown[]
	merge_revision_id: number
}

export const mergeBranch = async (
	branchId: number,
	resolutions: Record<string, MergeResolution>,
	dryRun = false,
): Promise<MergeResult> => {
	const res = await CytometryApi.post(
		`/analytics/branches/${branchId}/merge/`,
		{ resolutions, dry_run: dryRun },
	)
	return res.data
}
