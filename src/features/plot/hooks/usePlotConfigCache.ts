import { useState, useEffect, useCallback, useMemo } from "react"
import type { PlotConfig, Scale } from "../../../types"

export type { PlotConfig } from "../../../types"

export interface CachedPlotConfig extends PlotConfig {
	xScale: Scale
	yScale: Scale
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	cutoff: number
	xAxis: string
	yAxis: string
	plotMode: "heatmap" | "scatter" | "histogram"
}

const STORAGE_PREFIX = "pandora_plot_config_cache"

function getStorageKey(scopeKey: string): string {
	return `${STORAGE_PREFIX}:${scopeKey}`
}

/**
 * Hook para cachear configurações de gráfico em localStorage.
 * Cada scopeKey guarda uma config separada, permitindo cache por gate/arquivo.
 */
export function usePlotConfigCache(scopeKey: string) {
	const [config, setConfig] = useState<CachedPlotConfig | null>(null)
	const [isReady, setIsReady] = useState(false)

	const storageKey = useMemo(() => getStorageKey(scopeKey), [scopeKey])

	// Carregar config do localStorage sempre que o scopeKey mudar
	useEffect(() => {
		setIsReady(false)
		try {
			const cached = localStorage.getItem(storageKey)
			if (cached) {
				setConfig(JSON.parse(cached))
			} else {
				setConfig(null)
			}
		} catch (error) {
			console.warn("Erro ao carregar config do cache:", error)
			setConfig(null)
		} finally {
			setIsReady(true)
		}
	}, [storageKey])

	const updateConfig = useCallback((newConfig: Partial<CachedPlotConfig>) => {
		setConfig((prev) => {
			const updated = prev ? { ...prev, ...newConfig } : { ...getDefaultConfig(), ...newConfig }
			try {
				localStorage.setItem(storageKey, JSON.stringify(updated))
			} catch (error) {
				console.warn("Erro ao salvar config no cache:", error)
			}
			return updated
		})
	}, [storageKey])

	const loadConfig = useCallback((partialConfig: Partial<CachedPlotConfig> = {}) => {
		return config ? { ...config, ...partialConfig } : { ...getDefaultConfig(), ...partialConfig }
	}, [config])

	const clearCache = useCallback(() => {
		try {
			localStorage.removeItem(storageKey)
			setConfig(null)
		} catch (error) {
			console.warn("Erro ao limpar cache:", error)
		}
	}, [storageKey])

	return {
		config,
		updateConfig,
		loadConfig,
		clearCache,
		isCached: config !== null,
		isReady,
	}
}

function getDefaultConfig(): CachedPlotConfig {
	return {
		xAxis: "FSC-A",
		yAxis: "SSC-A",
		plotMode: "scatter",
		xScale: "linear",
		yScale: "linear",
		xMin: "",
		xMax: "",
		yMin: "",
		yMax: "",
		cutoff: 0,
	}
}
