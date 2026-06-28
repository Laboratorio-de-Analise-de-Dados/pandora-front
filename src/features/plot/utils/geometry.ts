/** Point-in-polygon test (ray casting). */
export const pointInPolygon = (px: number, py: number, verts: [number, number][]): boolean => {
	let inside = false
	const n = verts.length
	for (let i = 0, j = n - 1; i < n; j = i++) {
		const [xi, yi] = verts[i]
		const [xj, yj] = verts[j]
		if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
			inside = !inside
		}
	}
	return inside
}

/** Converte as bordas (n+1) do histograma em centros (n) para o eixo do heatmap. */
export const edgesToCenters = (edges?: number[]): number[] => {
	if (!edges || edges.length < 2) return []
	const centers: number[] = []
	for (let i = 0; i < edges.length - 1; i++) {
		centers.push((edges[i] + edges[i + 1]) / 2)
	}
	return centers
}
