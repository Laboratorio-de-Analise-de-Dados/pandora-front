import type { ExperimentFiles, Gate, GateCoordinates } from "../../../types"

/** Procura recursivamente um gate pela id. */
export const findGateInTree = (gates: Gate[], id: number): Gate | undefined => {
	for (const gate of gates) {
		if (gate.id === id) return gate
		if (gate.children) {
			const found = findGateInTree(gate.children, id)
			if (found) return found
		}
	}
	return undefined
}

/** Coleta todos os gates da árvore recursivamente. */
export const collectAllGates = (gates: Gate[]): Gate[] => {
	const result: Gate[] = []
	for (const g of gates) {
		result.push(g)
		if (g.children) result.push(...collectAllGates(g.children))
	}
	return result
}

/** Encontra o arquivo que contém um determinado gate. */
export const findFileForGate = (files: ExperimentFiles[], gateId: number): ExperimentFiles | undefined => {
	for (const f of files) {
		if (findGateInTree(f.gates, gateId)) return f
	}
	return undefined
}

/** Constrói o caminho hierárquico de um gate (ex: "Lymphocytes > CD3+ > CD4+"). */
export const buildGateStrategy = (gates: Gate[], targetId: number, path: string[] = []): string | null => {
	for (const g of gates) {
		const current = [...path, g.name]
		if (g.id === targetId) return current.join(" > ")
		if (g.children) {
			const found = buildGateStrategy(g.children, targetId, current)
			if (found) return found
		}
	}
	return null
}

/** Retorna o gate strategy completo buscando em todos os arquivos. */
export const getGateStrategy = (files: ExperimentFiles[], gateId: number): string => {
	for (const f of files) {
		const strategy = buildGateStrategy(f.gates, gateId)
		if (strategy) return strategy
	}
	return ""
}

/** Extrai a descrição dos eixos usados para construir o gate. */
export const gateAxesLabel = (gc: GateCoordinates): string | null => {
	const gateType = gc.type ?? "rectangle"
	const xAxis = "x_axis" in gc ? gc.x_axis : undefined
	const yAxis = "y_axis" in gc ? gc.y_axis : undefined
	if (gateType === "interval" && xAxis) return xAxis
	if (xAxis && yAxis) return `${xAxis} × ${yAxis}`
	return null
}

/** Computa os child gates para um determinado source. */
export const getChildGatesForSource = (
	files: ExperimentFiles[],
	source: { type: "file" | "gate"; id: number } | undefined,
): Gate[] => {
	if (!source) return []
	if (source.type === "file") {
		const file = files.find((f) => f.id === source.id)
		return file?.gates ?? []
	}
	for (const file of files) {
		const gate = findGateInTree(file.gates, source.id)
		if (gate) return gate.children ?? []
	}
	return []
}

/** Retorna o id raiz da cadeia de copied_from de um gate, percorrendo a árvore. */
export const getRootCopiedFromId = (
	files: ExperimentFiles[],
	gateId: number,
): number | null => {
	const visited = new Set<number>()
	let currentId = gateId
	while (true) {
		if (visited.has(currentId)) break
		visited.add(currentId)
		const gate = findGateInTree(files.flatMap((f) => f.gates), currentId)
		if (!gate || !gate.copied_from_id) break
		currentId = gate.copied_from_id
	}
	return currentId === gateId ? null : currentId
}
