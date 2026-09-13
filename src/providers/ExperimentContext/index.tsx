import React, {
	createContext,
	useContext,
	FC,
	ReactNode,
	useState,
	useEffect,
	useCallback,
} from "react"
import CytometryApi from "../../API"
import { AxiosResponse } from "axios"
import type { Experiment } from "../../types"
import { useAuth } from "../AuthContext"
import {
	completeExperimentFileUpload,
	initExperimentFileUpload,
	uploadExperimentFileChunk,
} from "../../services/experimentService"

type ChunkStatus = "pending" | "uploaded" | "failed"

interface ChunkProgress {
	index: number
	status: ChunkStatus
}

interface ExperimentContextProps {
	experiments: Experiment[]
	listExperiments: () => void
	createExperiment: (
		title: string,
		type: string,
		file: File,
		organizationId?: number | null,
	) => Promise<AxiosResponse>
	addExperimentFile: (
		experimentId: number,
		file: File,
	) => Promise<{ added: number; skipped: string[] }>
	progress: ChunkProgress[]
}

const ExperimentContext = createContext<ExperimentContextProps | undefined>(
	undefined,
)

export const useExperimentsContext = (): ExperimentContextProps => {
	const context = useContext(ExperimentContext)
	if (!context) {
		throw new Error(
			"useExperimentsContext must be used within a SelectionProvider",
		)
	}
	return context
}

interface ExperimentProviderProps {
	children: ReactNode
}

export const ExperimentProvider: FC<ExperimentProviderProps> = ({
	children,
}) => {
	const { user } = useAuth()
	const [experiments, setExperiments] = useState<Experiment[]>([])
	const [progress, setProgress] = useState<ChunkProgress[]>([])
	const listExperiments = useCallback(async function nts() {
		const experiments = await CytometryApi.get("/experiment")
		setExperiments([...experiments.data])
	}, [])

	const chunkSize = 0.5 * 1024 * 1024

	const sendAllChunks = useCallback(
		async (
			file: File,
			totalChunks: number,
			send: (index: number, chunk: Blob) => Promise<void>,
		) => {
			const guide: ChunkProgress[] = Array.from(
				{ length: totalChunks },
				(_, i) => ({ index: i, status: "pending" as ChunkStatus }),
			)
			setProgress(guide)

			const sendChunk = async (index: number) => {
				const start = index * chunkSize
				const end = Math.min(file.size, start + chunkSize)
				try {
					await send(index, file.slice(start, end))
					guide[index].status = "uploaded"
				} catch {
					guide[index].status = "failed"
				}
				setProgress([...guide])
			}

			await Promise.allSettled(guide.map((c) => sendChunk(c.index)))
			if (!guide.every((c) => c.status === "uploaded")) {
				throw new Error("Nem todos os chunks foram enviados com sucesso")
			}
		},
		[chunkSize],
	)

	const createExperiment = useCallback(
		async (
			title: string,
			type: string,
			file: File,
			organizationId?: number | null,
		) => {
			const totalChunks = Math.ceil(file.size / chunkSize)
			const orgId =
				organizationId === undefined
					? (user?.memberships?.[0]?.organization?.id ?? null)
					: organizationId

			const initResponse = await CytometryApi.post("/experiment/init/", {
				title,
				type,
				totalChunks,
				fileName: file.name,
				organizationId: orgId,
			})
			const fileId = initResponse.data.fileId

			localStorage.setItem(
				"currentUpload",
				JSON.stringify({ fileId, title, type }),
			)

			await sendAllChunks(file, totalChunks, async (index, chunk) => {
				const formData = new FormData()
				formData.append("fileId", fileId)
				formData.append("chunkIndex", index.toString())
				formData.append("chunk", chunk)
				await CytometryApi.post("/experiment/upload-chunk/", formData)
			})

			const completeResponse = await CytometryApi.post(
				"/experiment/complete/",
				{ fileId, fileName: file.name },
			)
			await listExperiments()
			localStorage.removeItem("currentUpload")
			return completeResponse
		},
		[listExperiments, sendAllChunks, chunkSize, user],
	)

	// "Adicionar arquivos" num experimento existente (BE-12): mesmo protocolo
	// de chunks, mas anexa via /experiment/files/* — o servidor aglutina .fcs
	// em ZIP e pula amostras já presentes no experimento.
	const addExperimentFile = useCallback(
		async (experimentId: number, file: File) => {
			const totalChunks = Math.ceil(file.size / chunkSize)
			const init = await initExperimentFileUpload(
				experimentId,
				file.name,
				totalChunks,
			)
			const fileId = init.fileId

			await sendAllChunks(file, totalChunks, (index, chunk) =>
				uploadExperimentFileChunk(fileId, index, chunk),
			)

			const done = await completeExperimentFileUpload(fileId, file.name)
			return { added: done.added, skipped: done.skipped }
		},
		[chunkSize, sendAllChunks],
	)

	useEffect(() => {
		listExperiments()
	}, [listExperiments])

	return (
		<ExperimentContext.Provider
			value={{
				experiments,
				listExperiments,
				createExperiment,
				addExperimentFile,
				progress,
			}}
		>
			{children}
		</ExperimentContext.Provider>
	)
}
