import React, { createContext, useContext, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import type { Experiment, ExperimentFiles, AnalysisResultData, Gate } from "../../../types"
import type { SelectedSource } from "../../../components/parent_tree"
import { getChildGatesForSource } from "../../gate/utils"
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

	const { data: experiment, isLoading } = useExperimentQuery(experimentId)
	const { data: experimentFiles = [] } = useExperimentFilesQuery(experimentId)
	const invalidateExperiment = useInvalidateExperiment(experimentId)

	const [source, setSource] = useState<SelectedSource | undefined>(undefined)

	const { data: fileStats } = useFileStatsQuery(source?.type, source?.id)

	const childGates = useMemo(
		() => getChildGatesForSource(experimentFiles, source),
		[experimentFiles, source],
	)
	const siblingGateNames = useMemo(() => childGates.map((g) => g.name), [childGates])
	const values = useMemo(() => experiment?.values ?? [], [experiment])

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
		}),
		[experimentId, experiment, experimentFiles, isLoading, source, fileStats, invalidateExperiment, childGates, siblingGateNames, values],
	)

	return (
		<ExperimentWorkspaceContext.Provider value={value}>
			{children}
		</ExperimentWorkspaceContext.Provider>
	)
}
