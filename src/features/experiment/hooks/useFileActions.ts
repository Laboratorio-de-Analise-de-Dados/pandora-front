import { useCallback } from "react"
import { toast } from "react-toastify"
import {
	disableFileData,
	enableFileData,
	updateFilesPlotConfig,
} from "../../../services/experimentService"
import {
	moveFileToSubsample,
	moveFilesToSubsample,
} from "../../../services/subsampleService"
import { buildSubsampleMoves } from "../utils/subsampleMoves"
import { updateGate } from "../../../services/gateService"
import {
	findFileForGate,
	gatesAtSamePath,
	getGatePathNames,
} from "../../gate/utils/gateTreeHelpers"
import { updateFileTags } from "../../../services/tagService"
import type { PlotViewConfig } from "../../../types"
import type { TagTarget } from "../../tags/utils/tagTargets"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"
import { useConfirm } from "../../../components/ConfirmDialog"
import { extractErrorMessage } from "../../../utils/apiError"

/**
 * Ações sobre amostras: desabilitar, reativar e mover entre subsamples.
 * A API opera uma amostra por chamada — o lote é `allSettled` + um refetch,
 * com toasts agregados por domínio.
 */
export function useFileActions() {
	const {
		experimentId,
		experimentFiles,
		source,
		setSource,
		invalidateExperiment,
	} = useExperimentWorkspace()
	const confirm = useConfirm()

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
			// FE-53 (BE-48): payload em lote — `null` = no-op honesto
			// (todas as selecionadas já estão no destino).
			const batch = buildSubsampleMoves(
				experimentFiles,
				fileDataIds,
				subsampleId,
			)
			if (!batch) {
				toast.info("As amostras selecionadas já estão nesse subsample")
				return
			}
			const moved = batch.moves.length
			try {
				try {
					await moveFilesToSubsample(experimentId, batch.moves)
					toast.success(
						moved === 1 ? "Amostra movida" : `${moved} amostras movidas`,
					)
				} catch (error) {
					// Backend sem a rota do BE-48 (404): fallback de uma PATCH
					// por amostra (BE-07) — remove quando o lote estiver em prod.
					const status = (error as { response?: { status?: number } }).response
						?.status
					if (status !== 404) throw error
					const results = await Promise.allSettled(
						batch.moves.map((m) => moveFileToSubsample(m.file_id, m.subsample)),
					)
					const failed = results.filter((r) => r.status === "rejected").length
					if (failed === 0) {
						toast.success(
							moved === 1 ? "Amostra movida" : `${moved} amostras movidas`,
						)
					} else {
						toast.warn(`${moved - failed} movida(s), ${failed} falharam.`)
					}
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao mover a amostra: ${extractErrorMessage(error)}`)
			}
		},
		[experimentFiles, experimentId, invalidateExperiment],
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

	/** FE-48 (BE-46): "aplicar a todas as amostras" — grava a config atual
	 * do plot em todas as amostras ativas. Fonte aberta = gate → aplica ao
	 * gate na mesma posição da árvore (mesmo caminho de nomes) em cada
	 * amostra, um PATCH por gate — o endpoint em lote só toca files. */
	const handleApplyPlotConfigToAll = useCallback(
		async (config: PlotViewConfig) => {
			const activeFiles = experimentFiles.filter((f) => f.active !== false)

			if (source?.type === "gate") {
				const sourceFile = findFileForGate(experimentFiles, source.id)
				const pathNames = sourceFile
					? getGatePathNames(sourceFile.gates, source.id)
					: null
				if (!pathNames) return
				const targets = gatesAtSamePath(activeFiles, pathNames)
				const label = pathNames.join(" > ")
				const ok = await confirm({
					title: "Aplicar ao gate em todas as amostras?",
					description: `Substitui a configuração de visualização salva do gate "${label}" em ${targets.length} amostras pela config atual do gráfico.`,
					confirmLabel: "Aplicar a todas",
				})
				if (!ok) return
				const results = await Promise.allSettled(
					targets.map((g) => updateGate(g.id, { plot_config: config })),
				)
				const failed = results.filter(
					(r): r is PromiseRejectedResult => r.status === "rejected",
				)
				const applied = targets.length - failed.length
				if (applied > 0) {
					toast.success(
						`Configuração aplicada ao gate "${label}" em ${applied} amostras`,
					)
					invalidateExperiment()
				}
				if (failed.length > 0) {
					toast.error(
						`Erro ao aplicar em ${failed.length} amostras: ${extractErrorMessage(failed[0].reason)}`,
					)
				}
				return
			}

			const ok = await confirm({
				title: "Aplicar a todas as amostras?",
				description: `Substitui a configuração de visualização salva de ${activeFiles.length} amostras pela config atual do gráfico.`,
				confirmLabel: "Aplicar a todas",
			})
			if (!ok) return
			try {
				const updated = await updateFilesPlotConfig(experimentId, config)
				toast.success(`Configuração aplicada a ${updated.length} amostras`)
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao aplicar: ${extractErrorMessage(error)}`)
			}
		},
		[confirm, experimentFiles, experimentId, invalidateExperiment, source],
	)

	return {
		handleDisableFile,
		handleEnableFile,
		handleMoveFileToSubsample,
		handleUpdateFileTags,
		handleApplyPlotConfigToAll,
	}
}
