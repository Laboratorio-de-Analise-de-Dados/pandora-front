/**
 * `plotly.js` não empacota tipos e o `@types/plotly.js` fica aninhado
 * (transitivo de `@types/react-plotly.js`, não hoisted pelo pnpm).
 * Declaração mínima só para o que usamos diretamente (`toImage` no export
 * de figuras); os tipos `Plotly.*` do namespace seguem via
 * `export as namespace` dos tipos de `react-plotly.js`.
 */
declare module "plotly.js" {
	export function toImage(
		gd: HTMLElement,
		options?: {
			format?: "png" | "svg" | "jpeg" | "webp"
			width?: number
			height?: number
		},
	): Promise<string>
}
