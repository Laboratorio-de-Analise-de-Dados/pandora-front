import React from "react"
import type { Gate, Scale } from "../../../../../types"
import { COFACTOR, biex, toRaw } from "../../../utils/biex"

interface PolygonEditOverlayProps {
	editingPolyGate: { gate: Gate; swapped: boolean }
	vertices: [number, number][]
	verticesRef: React.MutableRefObject<[number, number][]>
	effXScale: Scale
	effYScale: Scale
	containerRef: React.RefObject<HTMLDivElement | null>
	dataToPixel: (
		dataX: number,
		dataY: number,
	) => { px: number; py: number } | null
	pixelToData: (
		px: number,
		py: number,
	) => { dataX: number; dataY: number } | null
	onVerticesChange: React.Dispatch<React.SetStateAction<[number, number][]>>
	onCommit: (gate: Gate, vertices: [number, number][]) => void
}

/** Overlay SVG com os vértices arrastáveis de um gate poligonal em edição. */
const PolygonEditOverlay: React.FC<PolygonEditOverlayProps> = ({
	editingPolyGate,
	vertices,
	verticesRef,
	effXScale,
	effYScale,
	containerRef,
	dataToPixel,
	pixelToData,
	onVerticesChange,
	onCommit,
}) => {
	if (vertices.length === 0) return null
	const { swapped } = editingPolyGate
	const xSc = swapped ? effYScale : effXScale
	const ySc = swapped ? effXScale : effYScale
	const cof = COFACTOR

	const pixelVerts = vertices.map((v) => {
		const rawX = swapped ? v[1] : v[0]
		const rawY = swapped ? v[0] : v[1]
		const dispX = xSc === "biex" ? biex(rawX, cof) : rawX
		const dispY = ySc === "biex" ? biex(rawY, cof) : rawY
		return dataToPixel(dispX, dispY)
	})

	if (pixelVerts.some((p) => p === null)) return null
	const validVerts = pixelVerts as { px: number; py: number }[]
	const polyPath =
		validVerts
			.map((v, i) => `${i === 0 ? "M" : "L"}${v.px},${v.py}`)
			.join(" ") + " Z"

	const handleVertexDrag = (idx: number) => (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		const container = containerRef.current
		if (!container) return
		const containerRect = container.getBoundingClientRect()

		const onMouseMove = (me: MouseEvent) => {
			const relX = me.clientX - containerRect.left
			const relY = me.clientY - containerRect.top
			const dataCoords = pixelToData(relX, relY)
			if (!dataCoords) return
			const rawX = toRaw(dataCoords.dataX, xSc, cof)
			const rawY = toRaw(dataCoords.dataY, ySc, cof)
			onVerticesChange((prev) => {
				const next = [...prev] as [number, number][]
				next[idx] = swapped ? [rawY, rawX] : [rawX, rawY]
				return next
			})
		}

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove)
			document.removeEventListener("mouseup", onMouseUp)
			onCommit(editingPolyGate.gate, verticesRef.current)
		}

		document.addEventListener("mousemove", onMouseMove)
		document.addEventListener("mouseup", onMouseUp)
	}

	return (
		<svg
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				pointerEvents: "none",
				zIndex: 10,
			}}
		>
			<path
				d={polyPath}
				fill="rgba(0,120,255,0.05)"
				stroke="rgba(0,120,255,0.9)"
				strokeWidth={2}
				pointerEvents="none"
			/>
			{validVerts.map((v, i) => (
				<circle
					key={i}
					cx={v.px}
					cy={v.py}
					r={6}
					fill="white"
					stroke="rgba(0,120,255,0.9)"
					strokeWidth={2}
					style={{ cursor: "grab", pointerEvents: "all" }}
					onMouseDown={handleVertexDrag(i)}
				/>
			))}
		</svg>
	)
}

export default PolygonEditOverlay
