import type { ChannelMeta, ExperimentFiles, Scale } from "../types"

/**
 * FE-51: rótulo de exibição do canal — custom (`channel_labels`, BE-47) >
 * stain ($PnS do header FCS) > nome cru. Com rótulo, **só o rótulo**
 * aparece (o par canal↔label fica explícito no dialog/home de config);
 * sem os dois: o cru como sempre foi.
 */
export const channelDisplayLabel = (
	channel: string,
	meta?: ChannelMeta,
	custom?: string | null,
): string => {
	const suffix = custom?.trim() || meta?.stain?.trim()
	return suffix || channel
}

/** Resolve o label no contexto de um arquivo — labels são por arquivo:
 * o mesmo canal em amostras diferentes pode ter rótulos diferentes. */
export const channelLabelForFile = (
	channel: string,
	file?: Pick<ExperimentFiles, "channel_meta" | "channel_labels">,
): string =>
	channelDisplayLabel(
		channel,
		file?.channel_meta?.find((m) => m.name === channel),
		file?.channel_labels?.[channel],
	)

/** Título do eixo do plot: com label mostra só o label — no gráfico a
 * pessoa quer ler o rótulo — e a escala segue entre parênteses quando
 * não-linear: `"F4/80 (biex)"`. Sem label, `"FL11-A (biex)"`/`"FSC-A"`. */
export const axisTitleLabel = (
	channel: string,
	file: Parameters<typeof channelLabelForFile>[1],
	scale: Scale,
): string => {
	const label =
		file?.channel_labels?.[channel]?.trim() ||
		file?.channel_meta?.find((m) => m.name === channel)?.stain?.trim()
	const base = label || channel
	return scale === "linear" ? base : `${base} (${scale})`
}
