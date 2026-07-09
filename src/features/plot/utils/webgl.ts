// Detecta suporte a WebGL uma única vez. Usado para escolher entre o trace
// `scattergl` do Plotly (acelerado por GPU, precisa de WebGL) e o `scatter`
// (SVG, funciona em qualquer navegador). Sem isso, navegadores sem WebGL
// mostram o erro feio "WebGL is not supported by your browser".
let cached: boolean | null = null

export function supportsWebGL(): boolean {
	try {
		const canvas = document.createElement("canvas")
		return !!window.WebGLRenderingContext && !!canvas.getContext("webgl")
	} catch {
		return false
	}
}
