import React, {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react"
import { useParams } from "react-router-dom"
import type {
	Experiment,
	ExperimentFiles,
	AnalysisResultData,
	Gate,
	PlotViewConfig,
} from "../../../types"
import type { SelectedSource } from "../../../components/parent_tree"
import {
	getChildGatesForSource,
	findGateInTree,
	getGatePathNames,
	findGateByPathNames,
} from "../../gate/utils"
import { defaultScale } from "../../plot/utils/biex"
import {
	useExperimentQuery,
	useExperimentFilesQuery,
	useFileStatsQuery,
	useInvalidateExperiment,
} from "../hooks/useExperimentData"

interface ExperimentWorkspaceValue {
	experimentId: string
	experiment: Experiment | undefined
	experimentFiles: ExperimentFiles[]
	isLoading: boolean
	source: SelectedSource | undefined
	setSource: (source: SelectedSource | undefined) => void
	fileStats: AnalysisResultData | null | undefined
	invalidateExperiment: () => void
	childGates: Gate[]
	siblingGateNames: string[]
	values: string[]
	selectedGate: Gate | undefined
	viewConfig: PlotViewConfig
	setViewConfig: (config: PlotViewConfig) => void
	goToAdjacentFile: (direction: 1 | -1) => void
	canGoPrevFile: boolean
	canGoNextFile: boolean
}

const DEFAULT_VIEW_CONFIG: PlotViewConfig = {
	xAxis: "FSC-A",
	yAxis: "SSC-A",
	xScale: defaultScale("FSC-A"),
	yScale: defaultScale("SSC-A"),
	xMin: "",
	xMax: "",
	yMin: "",
	yMax: "",
	cutoff: 0,
	plotMode: "scatter",
}

const ExperimentWorkspaceContext = createContext<ExperimentWorkspaceValue | undefined>(undefined)

export function useExperimentWorkspace(): ExperimentWorkspaceValue {
	const ctx = useContext(ExperimentWorkspaceContext)
	if (!ctx) {
		throw new Error("useExperimentWorkspace must be used within ExperimentWorkspaceProvider")
	}
	return ctx
}

export function ExperimentWorkspaceProvider({ children }: { children: React.ReactNode }) {
	const { id: experimentId = "" } = useParams<{ id: string }>()

	const { data: experiment, isLoading: isLoadingExperiment } =
		useExperimentQuery(experimentId)
	const { data: experimentFiles = [], isLoading: isLoadingFiles } =
		useExperimentFilesQuery(experimentId)
	// A tela só sai do loading quando experimento E arquivos terminaram de
	// carregar, pra não piscar o estado vazio antes da árvore existir.
	const isLoading = isLoadingExperiment || isLoadingFiles
	const invalidateExperiment = useInvalidateExperiment(experimentId)

	const [source, setSource] = useState<SelectedSource | undefined>(undefined)

	const { data: fileStats } = useFileStatsQuery(source?.type, source?.id)

	const childGates = useMemo(
		() => getChildGatesForSource(experimentFiles, source),
		[experimentFiles, source],
	)
	const siblingGateNames = useMemo(() => childGates.map((g) => g.name), [childGates])
	const values = useMemo(() => experiment?.values ?? [], [experiment])

	// Config de visualização corrente (carry-forward em memória, estilo FlowJo):
	// segue de um arquivo/gate pro próximo até que um gate com config própria a
	// sobrescreva.
	const [viewConfig, setViewConfig] = useState<PlotViewConfig>(DEFAULT_VIEW_CONFIG)

	const selectedGate = useMemo(() => {
		if (source?.type !== "gate") return undefined
		for (const f of experimentFiles) {
			const g = findGateInTree(f.gates, source.id)
			if (g) return g
		}
		return undefined
	}, [experimentFiles, source])

	const currentFileIndex = useMemo(() => {
		if (!source) return -1
		return experimentFiles.findIndex((f: ExperimentFiles) => f.id === source.fileDataId)
	}, [experimentFiles, source])

	const canGoPrevFile = currentFileIndex > 0
	const canGoNextFile =
		currentFileIndex >= 0 && currentFileIndex < experimentFiles.length - 1

	// Navega pro arquivo anterior/seguinte mantendo a mesma estratégia de gate.
	// Casa o gate pelo caminho de nomes; se o arquivo alvo não tiver o gate
	// exato, cai no ancestral existente mais próximo; sem gate, seleciona a raiz.
	const goToAdjacentFile = useCallback(
		(direction: 1 | -1) => {
			if (!source || currentFileIndex < 0) return
			const targetIndex = currentFileIndex + direction
			if (targetIndex < 0 || targetIndex >= experimentFiles.length) return
			const targetFile = experimentFiles[targetIndex]

			const selectFileRoot = () =>
				setSource({
					type: "file",
					id: targetFile.id,
					name: targetFile.file_name,
					fileDataId: targetFile.id,
				})

			if (source.type === "file") {
				selectFileRoot()
				return
			}

			const currentFile = experimentFiles[currentFileIndex]
			const pathNames = getGatePathNames(currentFile.gates, source.id)
			if (!pathNames) {
				selectFileRoot()
				return
			}
			const targetGate = findGateByPathNames(targetFile.gates, pathNames, true)
			if (targetGate) {
				setSource({
					type: "gate",
					id: targetGate.id,
					name: targetGate.name,
					fileDataId: targetFile.id,
				})
			} else {
				selectFileRoot()
			}
		},
		[source, currentFileIndex, experimentFiles],
	)

	const value = useMemo<ExperimentWorkspaceValue>(
		() => ({
			experimentId,
			experiment,
			experimentFiles,
			isLoading,
			source,
			setSource,
			fileStats,
			invalidateExperiment,
			childGates,
			siblingGateNames,
			values,
			selectedGate,
			viewConfig,
			setViewConfig,
			goToAdjacentFile,
			canGoPrevFile,
			canGoNextFile,
		}),
		[experimentId, experiment, experimentFiles, isLoading, source, fileStats, invalidateExperiment, childGates, siblingGateNames, values, selectedGate, viewConfig, goToAdjacentFile, canGoPrevFile, canGoNextFile],
	)

	return (
		<ExperimentWorkspaceContext.Provider value={value}>
			{children}
		</ExperimentWorkspaceContext.Provider>
	)
}
