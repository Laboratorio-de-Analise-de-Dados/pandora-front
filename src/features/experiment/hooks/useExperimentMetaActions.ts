import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import {
	checkFileHash,
	deleteExperiment,
	downloadExperiment,
	updateExperiment,
} from "../../../services/experimentService"
import type { UpdateExperimentPayload } from "../../../services/experimentService"
import { useAuth } from "../../../providers/AuthContext"
import { useConfirm } from "../../../components/ConfirmDialog"
import { useExperimentsContext } from "../../../providers/ExperimentContext"
import { sha256File } from "../../../utils/fileHash"
import {
	ACCEPTED_EXPERIMENT_FILE_MESSAGE,
	findDuplicateFileNames,
	isAcceptedExperimentFile,
} from "../../../utils/experimentFile"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"
import { extractErrorMessage } from "../../../utils/apiError"
import { EXPERIMENT_TYPES_QUERY_KEY } from "./useExperimentTypes"
import { useFileUploadQueue } from "./useFileUploadQueue"

/** Metadados do experimento: editar, desativar, baixar e anexar arquivos. */
export function useExperimentMetaActions() {
	const navigate = useNavigate()
	const { experiment, invalidateExperiment } = useExperimentWorkspace()
	const { user } = useAuth()
	const { addExperimentFile } = useExperimentsContext()
	const queryClient = useQueryClient()
	const confirm = useConfirm()

	const [savingExperiment, setSavingExperiment] = useState(false)
	const uploadQueue = useFileUploadQueue()

	// Espelha a regra do backend: criador, super admin ou membro do lab do
	// experimento podem editar/excluir.
	const canEditExperiment = Boolean(
		experiment &&
		user &&
		(user.is_super_admin ||
			experiment.created_by === user.id ||
			user.memberships.some(
				(membership) =>
					membership.organization.id === experiment.organization?.id,
			)),
	)

	const handleUpdateExperiment = useCallback(
		async (payload: UpdateExperimentPayload): Promise<string | null> => {
			if (!experiment) return "Experimento não carregado"
			setSavingExperiment(true)
			try {
				await updateExperiment(experiment.id, payload)
				toast.success("Experimento atualizado!")
				invalidateExperiment()
				// PATCH de `type` pode ter criado entrada nova no vocabulário (BE-28).
				queryClient.invalidateQueries({
					queryKey: EXPERIMENT_TYPES_QUERY_KEY,
				})
				return null
			} catch (error) {
				return extractErrorMessage(error)
			} finally {
				setSavingExperiment(false)
			}
		},
		[experiment, invalidateExperiment, queryClient],
	)

	const handleDelete = useCallback(async () => {
		if (!experiment) return
		const confirmed = await confirm({
			title: "Desativar experimento",
			description:
				"Ele sai das listagens, mas os dados são preservados e ele " +
				"pode ser reativado depois.",
			confirmLabel: "Desativar",
			severity: "danger",
		})
		if (!confirmed) return
		try {
			await deleteExperiment(experiment.id)
			toast.success("Experimento desativado.")
			navigate("/experiments")
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error)
			toast.error(`Erro ao desativar o experimento: ${errorMessage}`)
		}
	}, [experiment, navigate, confirm])

	// BE-12/FE-43: anexa um lote de ZIPs/.fcs ao experimento, um por vez.
	// A dedup é escopada a este experimento — o check-hash pergunta antes
	// de subir (uma confirmação só para o lote) e o servidor ainda pula
	// amostras duplicadas na extração (reportadas em `skipped`). Falha de
	// um arquivo não derruba os demais — o item fica com erro e pode ser
	// re-tentado individualmente.
	const uploadForFile = useCallback(
		(experimentId: number, file: File) =>
			(onProgress: (percent: number) => void) =>
				addExperimentFile(experimentId, file, onProgress),
		[addExperimentFile],
	)

	const handleAddFiles = useCallback(
		async (files: File[]) => {
			if (!experiment || files.length === 0) return

			const accepted = files.filter((file) =>
				isAcceptedExperimentFile(file.name),
			)
			files
				.filter((file) => !isAcceptedExperimentFile(file.name))
				.forEach((file) =>
					toast.error(
						`"${file.name}" não é um formato aceito. ` +
							ACCEPTED_EXPERIMENT_FILE_MESSAGE,
					),
				)
			if (accepted.length === 0) return

			const duplicateNames = findDuplicateFileNames(accepted)
			const seen = new Set<string>()
			const unique = accepted.filter((file) => {
				const key = file.name.trim().toLowerCase()
				if (seen.has(key)) return false
				seen.add(key)
				return true
			})
			if (duplicateNames.length > 0) {
				toast.warn(`Nome duplicado ignorado: ${duplicateNames.join(", ")}`)
			}

			try {
				const alreadyPresent: string[] = []
				for (const file of unique) {
					const hash = await sha256File(file).catch(() => null)
					if (!hash) continue
					const check = await checkFileHash(hash, experiment.id)
					if (check.exists) {
						alreadyPresent.push(check.file_name ?? file.name)
					}
				}
				if (alreadyPresent.length > 0) {
					const proceed = await confirm({
						title:
							alreadyPresent.length === 1
								? "Arquivo duplicado"
								: "Arquivos duplicados",
						description:
							`${alreadyPresent.length} arquivo(s) já estão neste ` +
							`experimento: ${alreadyPresent.join(", ")}. Enviar ` +
							"mesmo assim? Amostras duplicadas serão ignoradas.",
						confirmLabel: "Enviar mesmo assim",
					})
					if (!proceed) return
				}
			} catch {
				// Sem hash não há aviso — o upload segue e o servidor deduplica.
			}

			const results = await uploadQueue.start(unique, (file) =>
				uploadForFile(experiment.id, file),
			)

			const succeeded = results.filter((r) => r !== null)
			const failed = results.length - succeeded.length
			const added = succeeded.reduce((sum, r) => sum + (r?.added ?? 0), 0)
			const skipped = succeeded.reduce(
				(sum, r) => sum + (r?.skipped?.length ?? 0),
				0,
			)
			const conflicts = succeeded.reduce(
				(sum, r) => sum + (r?.nameConflicts?.length ?? 0),
				0,
			)

			if (failed > 0) {
				toast.warn(
					`${added} amostra(s) adicionada(s); ${failed} de ` +
						`${results.length} arquivo(s) falharam — dá para ` +
						"tentar de novo na lista.",
				)
			} else if (skipped > 0 || conflicts > 0) {
				toast.warn(
					`${added} amostra(s) adicionada(s)` +
						(skipped > 0 ? `; ${skipped} já existia(m) no experimento` : "") +
						(conflicts > 0
							? `; ${conflicts} com nome em conflito ignorada(s)`
							: ""),
				)
			} else {
				toast.success(
					added === 1
						? "1 amostra adicionada"
						: `${added} amostras adicionadas`,
				)
			}
			if (added > 0) invalidateExperiment()
		},
		[experiment, invalidateExperiment, confirm, uploadQueue, uploadForFile],
	)

	const handleRetryUpload = useCallback(
		(index: number) => {
			const item = uploadQueue.items[index]
			if (!experiment || !item) return
			void uploadQueue
				.retry(index, uploadForFile(experiment.id, item.file))
				.then((outcome) => {
					if (outcome) invalidateExperiment()
				})
		},
		[experiment, uploadQueue, uploadForFile, invalidateExperiment],
	)

	const handleDownload = useCallback(async () => {
		if (!experiment) return
		try {
			await downloadExperiment(experiment.id, experiment.title)
		} catch (error) {
			toast.error(`Erro ao baixar: ${extractErrorMessage(error)}`)
		}
	}, [experiment])

	return {
		handleDelete,
		handleAddFiles,
		addingFile: uploadQueue.running,
		uploadItems: uploadQueue.items,
		handleRetryUpload,
		clearUploadItems: uploadQueue.reset,
		handleDownload,
		handleUpdateExperiment,
		savingExperiment,
		canEditExperiment,
	}
}
