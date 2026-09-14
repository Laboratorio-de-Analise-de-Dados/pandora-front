import { useCallback, useRef } from "react"
import type { Gate, GateCoordinates, Scale } from "../../../../../types"
import type { GateShape } from "../../../hooks/useGateShapes"
import type { GateTool } from "../../../hooks/usePlotState"
import { COFACTOR, toRaw } from "../../../utils/biex"

interface UseGateShapeEditingParams {
	gateShapes: GateShape[]
	editingPolyGate: { gate: Gate; swapped: boolean } | null
	tool: GateTool
	reshapingGateId: number | null
	effXScale: Scale
	effYScale: Scale
	patchCoordinates: (gateId: number, coords: GateCoordinates) => Promise<void>
}

export function useGateShapeEditing({
	gateShapes,
	editingPolyGate,
	tool,
	reshapingGateId,
	effXScale,
	effYScale,
	patchCoordinates,
}: UseGateShapeEditingParams) {
	const shapeGateMap = useRef<Array<{ gate: Gate; swapped: boolean } | null>>(
		[],
	)

	const filteredShapes = editingPolyGate
		? gateShapes.filter(
				(s) => !(s._gateData && s._gateData.id === editingPolyGate.gate.id),
			)
		: gateShapes

	const editableShapes = filteredShapes.map((shape, i) => {
		const gateData = shape._gateData ?? null
		const swappedFlag = shape._swapped ?? false
		shapeGateMap.current[i] = gateData
			? { gate: gateData, swapped: swappedFlag }
			: null
		const isEditTool = tool === "edit" && shape.type === "rect"
		const isReshaping =
			reshapingGateId !== null &&
			gateData?.id === reshapingGateId &&
			shape.type === "rect"
		return { ...shape, editable: isEditTool || isReshaping }
	})
	shapeGateMap.current.length = editableShapes.length

	const handleRelayout = useCallback(
		async (relayoutData: Record<string, number>) => {
			if (tool !== "edit" && reshapingGateId === null) return
			const shapeUpdates = new Map<number, Record<string, number>>()
			for (const key of Object.keys(relayoutData)) {
				const m = key.match(/^shapes\[(\d+)\]\.(\w+)$/)
				if (!m) continue
				const idx = parseInt(m[1], 10)
				const prop = m[2]
				if (!shapeUpdates.has(idx)) shapeUpdates.set(idx, {})
				shapeUpdates.get(idx)![prop] = relayoutData[key]
			}
			for (const [idx, props] of shapeUpdates) {
				const entry = shapeGateMap.current[idx]
				if (!entry) continue
				const { gate, swapped } = entry
				const gc = gate.gate_coordinates
				const gateType = gc.type ?? "rectangle"
				if (gateType !== "rectangle" && gateType !== "interval") continue
				const cof = COFACTOR

				if (gateType === "rectangle") {
					const shape = editableShapes[idx]
					const x0 = props.x0 ?? (shape.x0 as number)
					const x1 = props.x1 ?? (shape.x1 as number)
					const y0 = props.y0 ?? (shape.y0 as number)
					const y1 = props.y1 ?? (shape.y1 as number)
					const xSc = swapped ? effYScale : effXScale
					const ySc = swapped ? effXScale : effYScale
					const rawX0 = toRaw(Math.min(x0, x1), xSc, cof)
					const rawX1 = toRaw(Math.max(x0, x1), xSc, cof)
					const rawY0 = toRaw(Math.min(y0, y1), ySc, cof)
					const rawY1 = toRaw(Math.max(y0, y1), ySc, cof)
					const xAxisLabel = "x_axis" in gc ? gc.x_axis : undefined
					const yAxisLabel = "y_axis" in gc ? gc.y_axis : undefined
					const newCoords = {
						type: "rectangle" as const,
						x_axis: xAxisLabel,
						y_axis: yAxisLabel,
						startX: swapped ? rawY0 : rawX0,
						endX: swapped ? rawY1 : rawX1,
						startY: swapped ? rawX0 : rawY0,
						endY: swapped ? rawX1 : rawY1,
					}
					await patchCoordinates(gate.id, newCoords)
				} else if (gateType === "interval") {
					const shape = editableShapes[idx]
					const x0 = props.x0 ?? (shape.x0 as number)
					const x1 = props.x1 ?? (shape.x1 as number)
					const rawX0 = toRaw(Math.min(x0, x1), effXScale, cof)
					const rawX1 = toRaw(Math.max(x0, x1), effXScale, cof)
					const xAxisLabel = "x_axis" in gc ? gc.x_axis : undefined
					const newCoords = {
						type: "interval" as const,
						x_axis: xAxisLabel as string,
						startX: rawX0,
						endX: rawX1,
					}
					await patchCoordinates(gate.id, newCoords)
				}
			}
		},
		[
			tool,
			reshapingGateId,
			editableShapes,
			effXScale,
			effYScale,
			patchCoordinates,
		],
	)

	const savePolygonVertices = useCallback(
		async (gate: Gate, vertices: [number, number][]) => {
			const gc = gate.gate_coordinates
			const xAxisLabel = "x_axis" in gc ? gc.x_axis : undefined
			const yAxisLabel = "y_axis" in gc ? gc.y_axis : undefined
			await patchCoordinates(gate.id, {
				type: "polygon" as const,
				x_axis: xAxisLabel,
				y_axis: yAxisLabel,
				vertices,
			})
		},
		[patchCoordinates],
	)

	return { editableShapes, handleRelayout, savePolygonVertices }
}
