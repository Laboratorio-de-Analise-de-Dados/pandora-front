import { useState, useEffect, useCallback } from "react"
import type { Scale } from "../../../types"
import type { PlotMode } from "./usePlotState"

export interface CachedPlotConfig {
	xScale: Scale
	yScale: Scale
	xMin: string
	xMax: string
	yMin: string
	yMax: string
	cutoff: number
}

const STORAGE_KEY = "pandora_plot_config_cache"

/**
 * Hook para cachear configurações de gráfico em localStorage
 * Preserva configurações de escala e ranges ao trocar entre gráficos
 */
export function usePlotConfigCache() {
	const [config, setConfig] = useState<CachedPlotConfig | null>(null)

	// Carregar config do localStorage ao montar
	useEffect(() => {
		try {
			const cached = localStorage.getItem(STORAGE_KEY)
			if (cached) {
				setConfig(JSON.parse(cached))
			}
		} catch (error) {
			console.warn("Erro ao carregar config do cache:", error)
		}
	}, [])

	const updateConfig = useCallback((newConfig: Partial<CachedPlotConfig>) => {
		setConfig((prev) => {
			const updated = prev ? { ...prev, ...newConfig } : { ...getDefaultConfig(), ...newConfig }
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
			} catch (error) {
				console.warn("Erro ao salvar config no cache:", error)
			}
			return updated
		})
	}, [])

	const loadConfig = useCallback((partialConfig: Partial<CachedPlotConfig>) => {
		return config ? { ...config, ...partialConfig } : getDefaultConfig()
	}, [config])

	const clearCache = useCallback(() => {
		try {
			localStorage.removeItem(STORAGE_KEY)
			setConfig(null)
		} catch (error) {
			console.warn("Erro ao limpar cache:", error)
		}
	}, [])

	return {
		config,
		updateConfig,
		loadConfig,
		clearCache,
		isCached: config !== null,
	}
}

function getDefaultConfig(): CachedPlotConfig {
	return {
		xScale: "linear",
		yScale: "linear",
		xMin: "",
		xMax: "",
		yMin: "",
		yMax: "",
		cutoff: 0,
	}
}
