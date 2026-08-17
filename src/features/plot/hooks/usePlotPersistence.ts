import { useEffect, useRef } from "react"
import { updateGate } from "../../../services/gateService"
import type { PlotViewConfig } from "../../../types"

const SAVE_DEBOUNCE_MS = 600

interface UsePlotPersistenceParams {
	sourceType: "file" | "gate"
	sourceId: number
	config: PlotViewConfig
	/** Atualiza o carry-forward em memória (config a herdar ao trocar de fonte). */
	onPersist: (config: PlotViewConfig) => void
}

/**
 * Persiste a configuração de visualização estilo FlowJo:
 * - no mount, semeia o carry-forward com a config atual (sem request);
 * - a cada mudança (debounced) atualiza o carry-forward e, se a fonte for um
 *   gate, faz PATCH do `plot_config` no backend.
 *
 * Falhas de PATCH são silenciosas de propósito — não travam a interação.
 */
export function usePlotPersistence({
	sourceType,
	sourceId,
	config,
	onPersist,
}: UsePlotPersistenceParams) {
	const isFirst = useRef(true)
	const onPersistRef = useRef(onPersist)
	onPersistRef.current = onPersist

	useEffect(() => {
		if (isFirst.current) {
			isFirst.current = false
			onPersistRef.current(config)
			return
		}
		const handle = setTimeout(() => {
			onPersistRef.current(config)
			if (sourceType === "gate") {
				updateGate(sourceId, { plot_config: config }).catch(() => undefined)
			}
		}, SAVE_DEBOUNCE_MS)
		return () => clearTimeout(handle)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		sourceType,
		sourceId,
		config.xAxis,
		config.yAxis,
		config.xScale,
		config.yScale,
		config.xMin,
		config.xMax,
		config.yMin,
		config.yMax,
		config.cutoff,
		config.plotMode,
	])
}
