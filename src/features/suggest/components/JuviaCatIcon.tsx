/**
 * Juvia — a gata branca, mascote da análise automática (irmã da frajola
 * do Pandora no header). Marca tudo que é sugerido/gerado pela Juvia:
 * entrada "Sugerir…" na toolbar e na árvore, badge `automatic` nas
 * gates e o título do dialog de pedido.
 */
export default function JuviaCatIcon({ size = 18 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 100 100"
			aria-hidden="true"
			focusable="false"
		>
			{/* orelhas */}
			<path d="M16 44 L24 6 L48 28 Z" fill="#F5F7FA" />
			<path d="M84 44 L76 6 L52 28 Z" fill="#F5F7FA" />
			<path d="M23 36 L27.5 15 L41.5 27 Z" fill="#F4A9C0" />
			<path d="M77 36 L72.5 15 L58.5 27 Z" fill="#F4A9C0" />
			{/* cabeça */}
			<ellipse
				cx="50"
				cy="60"
				rx="37"
				ry="33"
				fill="#F5F7FA"
				stroke="#D8DEE7"
				strokeWidth="1.5"
			/>
			{/* olhos — azul claro com pupila vertical */}
			<ellipse cx="35" cy="56" rx="7.5" ry="9" fill="#7CC4F0" />
			<ellipse cx="65" cy="56" rx="7.5" ry="9" fill="#7CC4F0" />
			<ellipse cx="35" cy="56" rx="2.2" ry="6" fill="#1F2937" />
			<ellipse cx="65" cy="56" rx="2.2" ry="6" fill="#1F2937" />
			{/* focinho */}
			<path d="M45 68 L55 68 L50 74 Z" fill="#F38BA8" />
			<path
				d="M50 74 Q50 78 44.5 79.5 M50 74 Q50 78 55.5 79.5"
				stroke="#64748B"
				strokeWidth="1.6"
				fill="none"
				strokeLinecap="round"
			/>
			{/* bigodes */}
			<path
				d="M8 60 L27 63 M8 68 L27 67 M8 76 L27 71"
				stroke="#94A3B8"
				strokeWidth="1.6"
				strokeLinecap="round"
				fill="none"
			/>
			<path
				d="M92 60 L73 63 M92 68 L73 67 M92 76 L73 71"
				stroke="#94A3B8"
				strokeWidth="1.6"
				strokeLinecap="round"
				fill="none"
			/>
		</svg>
	)
}
