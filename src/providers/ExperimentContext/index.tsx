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

type ChunkStatus = "pending" | "uploaded" | "failed"

interface ChunkProgress {
	index: number
	status: ChunkStatus
}

interface ExperimentContextProps {
	experiments: any[]
	listExperiments: () => void
	createExperiment: (
		title: string,
		type: string,
		file: File
	) => Promise<AxiosResponse<any, any>>
	progress: ChunkProgress[]
}

const ExperimentContext = createContext<ExperimentContextProps | undefined>(
	undefined
)

export const useExperimentsContext = (): ExperimentContextProps => {
	const context = useContext(ExperimentContext)
	if (!context) {
		throw new Error(
			"useExperimentsContext must be used within a SelectionProvider"
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
	const [experiments, setExperiments] = useState<any[]>([])
	const [progress, setProgress] = useState<ChunkProgress[]>([])
	const listExperiments = useCallback(async function nts() {
		const experiments = await CytometryApi.get("/experiment")
		setExperiments([...experiments.data])
	}, [])

	const createExperiment = useCallback(
		async (title: string, type: string, file: File) => {
			const chunkSize = 0.5 * 1024 * 1024
			const totalChunks = Math.ceil(file.size / chunkSize)

			const initResponse = await CytometryApi.post("/experiment/init/", {
				title,
				type,
				totalChunks,
			})
			const fileId = initResponse.data.fileId

			// salva no localStorage para persistir entre reloads
			localStorage.setItem(
				"currentUpload",
				JSON.stringify({ fileId, title, type })
			)

			let guide: ChunkProgress[] = Array.from(
				{ length: totalChunks },
				(_, i) => ({
					index: i,
					status: "pending",
				})
			)
			setProgress(guide)

			const sendChunk = async (index: number) => {
				const start = index * chunkSize
				const end = Math.min(file.size, start + chunkSize)
				const chunk = file.slice(start, end)

				const formData = new FormData()
				formData.append("fileId", fileId)
				formData.append("chunkIndex", index.toString())
				formData.append("chunk", chunk)

				try {
					await CytometryApi.post("/experiment/upload-chunk/", formData)
					guide[index].status = "uploaded"
				} catch {
					guide[index].status = "failed"
				}
				setProgress([...guide])
			}

			await Promise.allSettled(guide.map((c) => sendChunk(c.index)))

			// 3. Finaliza experimento se todos os chunks subiram
			if (guide.every((c) => c.status === "uploaded")) {
				const completeResponse = await CytometryApi.post(
					"/experiment/complete/",
					{
						fileId,
					}
				)
				await listExperiments()
				localStorage.removeItem("currentUpload") // limpa sessão
				return completeResponse
			} else {
				throw new Error("Nem todos os chunks foram enviados com sucesso")
			}
		},
		[listExperiments]
	)

	useEffect(() => {
		listExperiments()
	}, [listExperiments])

	return (
		<ExperimentContext.Provider
			value={{ experiments, listExperiments, createExperiment, progress }}
		>
			{children}
		</ExperimentContext.Provider>
	)
}
