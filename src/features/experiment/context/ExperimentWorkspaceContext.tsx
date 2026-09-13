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
	Subsample,
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
	useSubsamplesQuery,
	useFileStatsQuery,
	useInvalidateExperiment,
} from "../hooks/useExperimentData"

interface ExperimentWorkspaceValue {
	experimentId: string
	experiment: Experiment | undefined
	experimentFiles: ExperimentFiles[]
	subsamples: Subsample[]
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
	plotInitialConfig: PlotViewConfig
	sourceLabel: string
	goToAdjacentFile: (direction: 1 | -1) => void
	canGoPrevFile: boolean
	canGoNextFile: boolean
	showInactiveFiles: boolean
	setShowInactiveFiles: (show: boolean) => void
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
	plotMode: "heatmap",
}

const ExperimentWorkspaceContext = createContext<
	ExperimentWorkspaceValue | undefined
>(undefined)

export function useExperimentWorkspace(): ExperimentWorkspaceValue {
	const ctx = useContext(ExperimentWorkspaceContext)
	if (!ctx) {
		throw new Error(
			"useExperimentWorkspace must be used within ExperimentWorkspaceProvider",
		)
	}
	return ctx
}

export function ExperimentWorkspaceProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const { id: experimentId = "" } = useParams<{ id: string }>()

	const { data: experiment, isLoading } = useExperimentQuery(experimentId)
	const [showInactiveFiles, setShowInactiveFiles] = useState(false)
	const { data: experimentFiles = [] } = useExperimentFilesQuery(
		experimentId,
		showInactiveFiles,
	)
	const { data: subsamples = [] } = useSubsamplesQuery(
		experimentId,
		showInactiveFiles,
	)
	const invalidateExperiment = useInvalidateExperiment(experimentId)

	const [source, setSourceState] = useState<SelectedSource | undefined>(
		undefined,
	)
	// Navegar entre arquivos preserva a config corrente; escolher uma fonte
	// explicitamente (árvore/dropdown) volta a respeitar o `plot_config` do gate.
	const [keepCurrentViewConfig, setKeepCurrentViewConfig] = useState(false)

	const setSource = useCallback((next: SelectedSource | undefined) => {
		setKeepCurrentViewConfig(false)
		setSourceState(next)
	}, [])

	const { data: fileStats } = useFileStatsQuery(source?.type, source?.id)

	const childGates = useMemo(
		() => getChildGatesForSource(experimentFiles, source),
		[experimentFiles, source],
	)
	const siblingGateNames = useMemo(
		() => childGates.map((g) => g.name),
		[childGates],
	)
	const values = useMemo(() => experiment?.values ?? [], [experiment])

	// Config de visualização corrente (carry-forward em memória, estilo FlowJo):
	// segue de um arquivo/gate pro próximo até que um gate com config própria a
	// sobrescreva.
	const [viewConfig, setViewConfig] =
		useState<PlotViewConfig>(DEFAULT_VIEW_CONFIG)

	const selectedGate = useMemo(() => {
		if (source?.type !== "gate") return undefined
		for (const f of experimentFiles) {
			const g = findGateInTree(f.gates, source.id)
			if (g) return g
		}
		return undefined
	}, [experimentFiles, source])

	// Amostras desabilitadas podem aparecer na árvore (filtro), mas não entram na
	// navegação entre arquivos — o backend recusa densidade de amostra inativa.
	const navigableFiles = useMemo(
		() => experimentFiles.filter((f: ExperimentFiles) => f.active !== false),
		[experimentFiles],
	)

	const currentFileIndex = useMemo(() => {
		if (!source) return -1
		return navigableFiles.findIndex(
			(f: ExperimentFiles) => f.id === source.fileDataId,
		)
	}, [navigableFiles, source])

	const canGoPrevFile = currentFileIndex > 0
	const canGoNextFile =
		currentFileIndex >= 0 && currentFileIndex < navigableFiles.length - 1

	// Navega pro arquivo anterior/seguinte mantendo a mesma estratégia de gate.
	// Casa o gate pelo caminho de nomes; se o arquivo alvo não tiver o gate
	// exato, cai no ancestral existente mais próximo; sem gate, seleciona a raiz.
	const goToAdjacentFile = useCallback(
		(direction: 1 | -1) => {
			if (!source || currentFileIndex < 0) return
			const targetIndex = currentFileIndex + direction
			if (targetIndex < 0 || targetIndex >= navigableFiles.length) return
			const targetFile = navigableFiles[targetIndex]
			setKeepCurrentViewConfig(true)

			const selectFileRoot = () =>
				setSourceState({
					type: "file",
					id: targetFile.id,
					name: targetFile.file_name,
					fileDataId: targetFile.id,
				})

			if (source.type === "file") {
				selectFileRoot()
				return
			}

			const currentFile = navigableFiles[currentFileIndex]
			const pathNames = getGatePathNames(currentFile.gates, source.id)
			if (!pathNames) {
				selectFileRoot()
				return
			}
			const targetGate = findGateByPathNames(targetFile.gates, pathNames, true)
			if (targetGate) {
				setSourceState({
					type: "gate",
					id: targetGate.id,
					name: targetGate.name,
					fileDataId: targetFile.id,
				})
			} else {
				selectFileRoot()
			}
		},
		[source, currentFileIndex, navigableFiles],
	)

	// "arquivo › gate › subgate" — mantém a amostra identificada acima do plot.
	const sourceLabel = useMemo(() => {
		if (!source) return ""
		const file = experimentFiles.find(
			(f: ExperimentFiles) => f.id === source.fileDataId,
		)
		const fileName = file?.file_name ?? source.name
		if (source.type !== "gate") return fileName
		const pathNames = file ? getGatePathNames(file.gates, source.id) : undefined
		return [fileName, ...(pathNames ?? [source.name])].join(" › ")
	}, [experimentFiles, source])

	const plotInitialConfig = useMemo<PlotViewConfig>(
		() =>
			keepCurrentViewConfig
				? viewConfig
				: { ...viewConfig, ...selectedGate?.plot_config },
		[keepCurrentViewConfig, viewConfig, selectedGate],
	)

	const value = useMemo<ExperimentWorkspaceValue>(
		() => ({
			experimentId,
			experiment,
			experimentFiles,
			subsamples,
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
			plotInitialConfig,
			sourceLabel,
			goToAdjacentFile,
			canGoPrevFile,
			canGoNextFile,
			showInactiveFiles,
			setShowInactiveFiles,
		}),
		[
			showInactiveFiles,
			experimentId,
			experiment,
			experimentFiles,
			subsamples,
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
			plotInitialConfig,
			sourceLabel,
			goToAdjacentFile,
			canGoPrevFile,
			canGoNextFile,
		],
	)

	return (
		<ExperimentWorkspaceContext.Provider value={value}>
			{children}
		</ExperimentWorkspaceContext.Provider>
	)
}
