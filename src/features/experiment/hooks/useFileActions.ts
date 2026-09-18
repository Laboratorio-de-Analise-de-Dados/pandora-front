import { useCallback } from "react"
import { toast } from "react-toastify"
import {
	disableFileData,
	enableFileData,
} from "../../../services/experimentService"
import { moveFileToSubsample } from "../../../services/subsampleService"
import { updateFileTags } from "../../../services/tagService"
import type { TagTarget } from "../../tags/utils/tagTargets"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"
import { extractErrorMessage } from "../../../utils/apiError"

/**
 * Ações sobre amostras: desabilitar, reativar e mover entre subsamples.
 * A API opera uma amostra por chamada — o lote é `allSettled` + um refetch,
 * com toasts agregados por domínio.
 */
export function useFileActions() {
	const { experimentFiles, source, setSource, invalidateExperiment } =
		useExperimentWorkspace()

	const handleDisableFile = useCallback(
		async (fileDataIds: number[]) => {
			try {
				const results = await Promise.allSettled(
					fileDataIds.map((id) => disableFileData(id)),
				)
				const failed = results.filter((r) => r.status === "rejected").length
				const done = fileDataIds.length - failed
				if (failed === 0) {
					toast.success(
						done === 1
							? "Amostra desabilitada. Os gates foram preservados."
							: `${done} amostras desabilitadas. Os gates foram preservados.`,
					)
				} else {
					toast.warn(`${done} desabilitada(s), ${failed} falharam.`)
				}
				if (source && fileDataIds.includes(source.fileDataId)) {
					const next = experimentFiles.find(
						(file) => !fileDataIds.includes(file.id) && file.active !== false,
					)
					setSource(
						next
							? {
									type: "file",
									id: next.id,
									name: next.file_name,
									fileDataId: next.id,
								}
							: undefined,
					)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(
					`Erro ao desabilitar a amostra: ${extractErrorMessage(error)}`,
				)
			}
		},
		[experimentFiles, invalidateExperiment, setSource, source],
	)

	const handleEnableFile = useCallback(
		async (fileDataIds: number[]) => {
			try {
				const results = await Promise.allSettled(
					fileDataIds.map((id) => enableFileData(id)),
				)
				const failed = results.filter((r) => r.status === "rejected").length
				const done = fileDataIds.length - failed
				if (failed === 0) {
					toast.success(
						done === 1 ? "Amostra reativada" : `${done} amostras reativadas`,
					)
				} else {
					toast.warn(`${done} reativada(s), ${failed} falharam.`)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao reativar a amostra: ${extractErrorMessage(error)}`)
			}
		},
		[invalidateExperiment],
	)

	const handleMoveFileToSubsample = useCallback(
		async (fileDataIds: number[], subsampleId: number | null) => {
			try {
				// A API move uma amostra por PATCH (BE-07) — o lote é N chamadas.
				const results = await Promise.allSettled(
					fileDataIds.map((id) => moveFileToSubsample(id, subsampleId)),
				)
				const failed = results.filter((r) => r.status === "rejected").length
				if (failed === 0) {
					toast.success(
						fileDataIds.length === 1
							? "Amostra movida"
							: `${fileDataIds.length} amostras movidas`,
					)
				} else {
					toast.warn(
						`${fileDataIds.length - failed} movida(s), ${failed} falharam.`,
					)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao mover a amostra: ${extractErrorMessage(error)}`)
			}
		},
		[invalidateExperiment],
	)

	/**
	 * Substitui as tags explícitas de uma ou mais amostras (BE-34). A API
	 * opera uma amostra por PUT — o lote é `allSettled`; devolve a primeira
	 * mensagem de erro pro diálogo exibir (ex.: exclusividade de controle).
	 */
	const handleUpdateFileTags = useCallback(
		async (targets: TagTarget[]): Promise<string | null> => {
			try {
				const results = await Promise.allSettled(
					targets.map((t) => updateFileTags(t.fileDataId, t.tagIds)),
				)
				const failed = results.filter((r) => r.status === "rejected")
				invalidateExperiment()
				if (failed.length === 0) return null
				return extractErrorMessage((failed[0] as PromiseRejectedResult).reason)
			} catch (error) {
				return extractErrorMessage(error)
			}
		},
		[invalidateExperiment],
	)

	return {
		handleDisableFile,
		handleEnableFile,
		handleMoveFileToSubsample,
		handleUpdateFileTags,
	}
}
