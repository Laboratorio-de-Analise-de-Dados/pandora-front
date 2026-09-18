export const GATE_PALETTE = [
	"#0078FF",
	"#E53935",
	"#43A047",
	"#FB8C00",
	"#8E24AA",
	"#00ACC1",
	"#F4511E",
	"#3949AB",
	"#7CB342",
	"#D81B60",
	"#546E7A",
	"#FFB300",
] as const

export type GatePaletteColor = (typeof GATE_PALETTE)[number]

// Texto dos labels de gate no plot: cor da fonte do gráfico (não a cor
// do gate) — cores claras de gate ficavam ilegíveis no fundo claro.
export const GATE_LABEL_COLOR = "rgba(0,0,0,0.78)"

export const getGateColor = (
	explicitColor: string | null | undefined,
	index: number,
): string => explicitColor || GATE_PALETTE[index % GATE_PALETTE.length]

export const hexToRgba = (hex: string, alpha: number): string => {
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	return `rgba(${r},${g},${b},${alpha})`
}
