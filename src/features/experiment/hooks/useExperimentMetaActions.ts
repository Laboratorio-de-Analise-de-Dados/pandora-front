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
	isAcceptedExperimentFile,
} from "../../../utils/experimentFile"
import { useExperimentWorkspace } from "../context/ExperimentWorkspaceContext"
import { extractErrorMessage } from "../../../utils/apiError"
import { EXPERIMENT_TYPES_QUERY_KEY } from "./useExperimentTypes"

/** Metadados do experimento: editar, desativar, baixar e anexar arquivos. */
export function useExperimentMetaActions() {
	const navigate = useNavigate()
	const { experiment, invalidateExperiment } = useExperimentWorkspace()
	const { user } = useAuth()
	const { addExperimentFile } = useExperimentsContext()
	const queryClient = useQueryClient()
	const confirm = useConfirm()

	const [addingFile, setAddingFile] = useState(false)
	const [savingExperiment, setSavingExperiment] = useState(false)

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

	// BE-12: anexa um ZIP ou .fcs ao experimento. A dedup é escopada a este
	// experimento — o check-hash pergunta antes de subir e o servidor ainda
	// pula amostras duplicadas na extração (reportadas em `skipped`).
	const handleAddFile = useCallback(
		async (file: File) => {
			if (!experiment) return
			if (!isAcceptedExperimentFile(file.name)) {
				toast.error(ACCEPTED_EXPERIMENT_FILE_MESSAGE)
				return
			}
			try {
				const hash = await sha256File(file).catch(() => null)
				if (hash) {
					const check = await checkFileHash(hash, experiment.id)
					if (check.exists) {
						const proceed = await confirm({
							title: "Arquivo duplicado",
							description:
								`"${check.file_name ?? file.name}" já está neste ` +
								"experimento. Enviar mesmo assim? Amostras duplicadas " +
								"serão ignoradas.",
							confirmLabel: "Enviar mesmo assim",
						})
						if (!proceed) return
					}
				}
			} catch {
				// Sem hash não há aviso — o upload segue e o servidor deduplica.
			}

			setAddingFile(true)
			try {
				const { added, skipped } = await addExperimentFile(experiment.id, file)
				if (skipped.length > 0) {
					toast.warn(
						`${added} amostra(s) adicionada(s); ${skipped.length} ` +
							`já existia(m) no experimento e foram ignoradas.`,
					)
				} else {
					toast.success(
						added === 1
							? "1 amostra adicionada"
							: `${added} amostras adicionadas`,
					)
				}
				invalidateExperiment()
			} catch (error) {
				toast.error(`Erro ao enviar o arquivo: ${extractErrorMessage(error)}`)
			} finally {
				setAddingFile(false)
			}
		},
		[experiment, addExperimentFile, invalidateExperiment, confirm],
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
		handleAddFile,
		addingFile,
		handleDownload,
		handleUpdateExperiment,
		savingExperiment,
		canEditExperiment,
	}
}
