import { useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import {
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	Typography,
} from "@mui/material"
import { MdCloudUpload as CloudUploadIcon } from "react-icons/md"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import { AppDialog } from "../../../../components/AppDialog"
import { useExperimentsContext } from "../../../../providers/ExperimentContext"
import { useAuth } from "../../../../providers/AuthContext"
import ExperimentFields from "../ExperimentFields"
import FileUploadQueueList from "../FileUploadQueueList"
import { useFileUploadQueue } from "../../hooks/useFileUploadQueue"
import type { UploadOneFile } from "../../hooks/useFileUploadQueue"
import {
	ACCEPTED_EXPERIMENT_FILE_ACCEPT,
	ACCEPTED_EXPERIMENT_FILE_MESSAGE,
	findDuplicateFileNames,
	isAcceptedExperimentFile,
} from "../../../../utils/experimentFile"
import { extractErrorMessage } from "../../../../utils/apiError"

interface NewExperimentDialogProps {
	open: boolean
	onClose: () => void
}

/**
 * Dialog de criação de experimento (título, tipo, contexto/lab, upload
 * multi-arquivo .fcs/.zip — FE-43). Compartilhado pelo card
 * "Novo experimento" da grade e pelo botão "+ Novo Experimento" do
 * cabeçalho da listagem (FE-26).
 */
export default function NewExperimentDialog({
	open,
	onClose,
}: NewExperimentDialogProps) {
	const [files, setFiles] = useState<File[]>([])
	const [title, setTitle] = useState("")
	const [experimentType, setExperimentType] = useState("")
	const [description, setDescription] = useState("")
	const [organizationId, setOrganizationId] = useState("")

	const { createExperiment, createExperimentEmpty, addExperimentFile } =
		useExperimentsContext()
	const { user } = useAuth()
	const queue = useFileUploadQueue()

	// Id do experimento criado no init do 1º arquivo — os demais sobem
	// por attach. Sobrevive a uma falha de complete: o attach/retry vai
	// para o experimento certo em vez de criar um novo (título único).
	const experimentIdRef = useRef<number | null>(null)

	useEffect(() => {
		if (!open) {
			setFiles([])
			setTitle("")
			setExperimentType("")
			setDescription("")
			setOrganizationId("")
			experimentIdRef.current = null
			queue.reset()
		}
		// `reset` é estável; depende só do ciclo de vida do dialog.
	}, [open])

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selected = Array.from(event.target.files ?? [])
		event.target.value = ""
		if (selected.length === 0) return

		const rejected = selected.filter(
			(file) => !isAcceptedExperimentFile(file.name),
		)
		rejected.forEach((file) =>
			toast.error(
				`"${file.name}" não é um formato aceito. ` +
					ACCEPTED_EXPERIMENT_FILE_MESSAGE,
			),
		)
		const accepted = selected.filter((file) =>
			isAcceptedExperimentFile(file.name),
		)

		setFiles((prev) => {
			const duplicates = findDuplicateFileNames([...prev, ...accepted])
			const existing = new Set(
				prev.map((file) => file.name.trim().toLowerCase()),
			)
			const incoming = new Set<string>()
			const kept = accepted.filter((file) => {
				const key = file.name.trim().toLowerCase()
				if (existing.has(key) || incoming.has(key)) return false
				incoming.add(key)
				return true
			})
			const skipped = accepted.length - kept.length
			if (skipped > 0 && duplicates.length > 0) {
				toast.warn(`Nome duplicado ignorado: ${duplicates.join(", ")}`)
			}
			return [...prev, ...kept]
		})
	}

	/** Protocolo por item da fila: enquanto o experimento não existir,
	 * o arquivo sobe pelo fluxo de criação; depois, por attach — o que
	 * vale também para retry de um item que falhou no meio da criação. */
	const uploadFor =
		(orgId: number | null) =>
		(file: File, index: number): UploadOneFile =>
		async (onProgress) => {
			if (index === 0 && experimentIdRef.current === null) {
				const experimentId = await createExperiment({
					title,
					type: experimentType,
					file,
					organizationId: orgId,
					description,
					onProgress,
					onExperimentCreated: (id) => {
						experimentIdRef.current = id
					},
				})
				experimentIdRef.current = experimentId
				return {}
			}
			const experimentId = experimentIdRef.current
			if (experimentId === null) {
				throw new Error(
					"A criação do experimento falhou — este arquivo não " +
						"foi enviado.",
				)
			}
			return addExperimentFile(experimentId, file, onProgress)
		}

	const onSave = async () => {
		if (!title || !experimentType || queue.running) return
		const orgId = organizationId === "" ? null : parseInt(organizationId, 10)
		try {
			if (files.length === 0) {
				await createExperimentEmpty(title, experimentType, orgId, description)
				onClose()
				return
			}
			const results = await queue.start(files, uploadFor(orgId))
			const allOk = results.every((r) => r !== null)
			if (allOk) {
				toast.success(
					files.length === 1
						? "Experimento criado"
						: `Experimento criado com ${files.length} arquivos`,
				)
				onClose()
			}
		} catch (error) {
			toast.error(extractErrorMessage(error) || "Erro ao criar experimento.")
		}
	}

	const handleRetry = (index: number) => {
		const item = queue.items[index]
		if (!item) return
		const orgId = organizationId === "" ? null : parseInt(organizationId, 10)
		void queue.retry(index, uploadFor(orgId)(item.file, index))
	}

	const memberships = user?.memberships || []
	const doneCount = queue.items.filter(
		(item) => item.status === "done" || item.status === "error",
	).length
	const batchStarted = queue.items.length > 0
	// Depois que a fila começa, "Salvar" sai de cena: a recuperação é por
	// item (retry) e o encerramento fica no "Fechar" — re-rodar o lote
	// inteiro re-enviaria arquivos já concluídos.
	const disabled = !title.trim() || !experimentType.trim() || batchStarted

	return (
		<AppDialog
			open={open}
			title="Novo experimento"
			onClose={onClose}
			maxWidth="sm"
			onConfirm={onSave}
			confirmLabel={queue.running ? "Enviando..." : "Salvar"}
			cancelLabel={batchStarted ? "Fechar" : "Cancelar"}
			confirmDisabled={disabled}
			confirmAutoFocus={false}
			loading={queue.running}
		>
			<ExperimentFields
				title={title}
				type={experimentType}
				description={description}
				onTitleChange={setTitle}
				onTypeChange={setExperimentType}
				onDescriptionChange={setDescription}
				idPrefix="new-experiment"
			/>

			<FormControl margin="normal" fullWidth>
				<InputLabel id="org-label">Contexto / Lab</InputLabel>
				<Select
					labelId="org-label"
					value={organizationId}
					label="Contexto / Lab"
					onChange={(e) => setOrganizationId(e.target.value)}
				>
					<MenuItem value="">
						<em>Pessoal (sem lab)</em>
					</MenuItem>
					{memberships.map((m) => (
						<MenuItem key={m.organization.id} value={m.organization.id}>
							{m.organization.name}
						</MenuItem>
					))}
				</Select>
				<FormHelperText>
					Escolha se o experimento é pessoal ou de um lab
				</FormHelperText>
			</FormControl>

			<FormControl margin="normal" fullWidth>
				<Button
					component="label"
					variant="contained"
					tabIndex={-1}
					startIcon={<CloudUploadIcon />}
					sx={{ alignSelf: "flex-start" }}
					disabled={queue.running || batchStarted}
				>
					{files.length > 0 ? "Adicionar arquivos" : "Upload files (opcional)"}
					<input
						type="file"
						accept={ACCEPTED_EXPERIMENT_FILE_ACCEPT}
						onChange={handleFileChange}
						multiple
						hidden
					/>
				</Button>
				<Typography variant="caption" marginTop={1}>
					Formatos aceitos: .fcs ou .zip — é possível selecionar vários arquivos
					de uma vez, ou adicionar amostras depois, dentro do experimento
				</Typography>
			</FormControl>

			{files.length > 0 && (
				<Box
					sx={{
						mt: 1,
						maxHeight: 220,
						overflowY: "auto",
						border: 1,
						borderColor: "divider",
						borderRadius: 1,
					}}
				>
					<FileUploadQueueList
						files={files}
						items={queue.items.length > 0 ? queue.items : undefined}
						running={queue.running}
						onRemove={(index) =>
							setFiles((prev) => prev.filter((_, i) => i !== index))
						}
						onRetry={handleRetry}
					/>
				</Box>
			)}

			{queue.items.length > 0 && (
				<Typography variant="caption" sx={{ mt: 1, display: "block" }}>
					{doneCount} de {queue.items.length} concluídos
				</Typography>
			)}
		</AppDialog>
	)
}
