import { useCallback, useState } from "react"
import { extractErrorMessage } from "../../../utils/apiError"

export type UploadItemStatus = "queued" | "uploading" | "done" | "error"

export interface UploadQueueItem {
	file: File
	status: UploadItemStatus
	/** Percentual de chunks enviados (0–100). */
	percent: number
	error?: string
	added?: number
	skipped?: string[]
	nameConflicts?: string[]
}

export interface FileUploadOutcome {
	added?: number
	skipped?: string[]
	nameConflicts?: string[]
}

/** Faz o upload de UM arquivo (init → chunks → complete) e reporta o
 * percentual de chunks enviados via `onProgress`. */
export type UploadOneFile = (
	onProgress: (percent: number) => void,
) => Promise<FileUploadOutcome>

/**
 * Fila sequencial de uploads (FE-43, par do BE-42): um arquivo por vez;
 * a falha de um item não derruba os seguintes e pode ser re-tentada
 * individualmente via `retry`.
 */
export function useFileUploadQueue() {
	const [items, setItems] = useState<UploadQueueItem[]>([])
	const [running, setRunning] = useState(false)

	const patchAt = useCallback(
		(index: number, patch: Partial<UploadQueueItem>) => {
			setItems((prev) =>
				prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
			)
		},
		[],
	)

	const runItem = useCallback(
		async (
			index: number,
			upload: UploadOneFile,
		): Promise<FileUploadOutcome | null> => {
			patchAt(index, { status: "uploading", percent: 0, error: undefined })
			try {
				const outcome = await upload((percent) => patchAt(index, { percent }))
				patchAt(index, {
					status: "done",
					percent: 100,
					added: outcome.added,
					skipped: outcome.skipped,
					nameConflicts: outcome.nameConflicts,
				})
				return outcome
			} catch (error) {
				patchAt(index, {
					status: "error",
					error: extractErrorMessage(error),
				})
				return null
			}
		},
		[patchAt],
	)

	/** `uploadFor(file, index)` decide o protocolo de cada item — na
	 * criação, o índice 0 sobe pelo fluxo de experimento e os demais por
	 * attach; no "adicionar arquivos", todos por attach. Retorna o
	 * outcome por item (`null` = falhou) na ordem da seleção. */
	const start = useCallback(
		async (
			files: File[],
			uploadFor: (file: File, index: number) => UploadOneFile,
		): Promise<(FileUploadOutcome | null)[]> => {
			setRunning(true)
			setItems(
				files.map((file) => ({
					file,
					status: "queued" as const,
					percent: 0,
				})),
			)
			const results: (FileUploadOutcome | null)[] = []
			try {
				for (let i = 0; i < files.length; i++) {
					results.push(await runItem(i, uploadFor(files[i], i)))
				}
				return results
			} finally {
				setRunning(false)
			}
		},
		[runItem],
	)

	const retry = useCallback(
		async (
			index: number,
			upload: UploadOneFile,
		): Promise<FileUploadOutcome | null> => {
			setRunning(true)
			try {
				return await runItem(index, upload)
			} finally {
				setRunning(false)
			}
		},
		[runItem],
	)

	const reset = useCallback(() => setItems([]), [])

	return { items, running, start, retry, reset }
}
