/**
 * Iniciais da tag pro chip compacto da árvore — o nome completo fica no
 * tooltip. "Referência biológica" → "RB", "Negativo (unstained)" → "NU",
 * "FMO" → "FMO", "lote 3" → "L3". Palavra única pega até 3 letras.
 */
export const tagInitials = (name: string): string => {
	const words = name
		.replace(/[()]/g, " ")
		.split(/[\s\-_]+/)
		.filter(Boolean)
	if (words.length === 0) return name.slice(0, 2).toUpperCase()
	if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
	return words
		.slice(0, 3)
		.map((w) => w[0])
		.join("")
		.toUpperCase()
}
