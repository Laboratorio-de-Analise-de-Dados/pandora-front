import { useMutation } from "@tanstack/react-query"
import { applyGates } from "../../../services/gateService"

/**
 * Dry-run do apply (FE-26): devolve conflitos de nome e amostras sem os
 * canais referenciados, sem gravar nada. Disparado pelo diálogo conforme o
 * usuário muda o escopo — não é query porque depende da seleção atual.
 */
export function useApplyGatePreview() {
	return useMutation({
		mutationFn: (params: {
			gateId: number
			targetFileDataIds: number[]
			recursive: boolean
		}) =>
			applyGates({
				source_gate_ids: [params.gateId],
				target_file_data_ids: params.targetFileDataIds,
				recursive: params.recursive,
				dry_run: true,
			}),
	})
}
