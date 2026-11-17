import type { ChannelMeta, ExperimentFiles, Scale } from "../types"

/**
 * FE-51: rótulo de exibição do canal — custom (`channel_labels`, BE-47) >
 * stain ($PnS do header FCS) > nome cru. Com rótulo: `"CRU (rótulo)"`;
 * sem os dois: o cru como sempre foi.
 */
export const channelDisplayLabel = (
	channel: string,
	meta?: ChannelMeta,
	custom?: string | null,
): string => {
	const suffix = custom?.trim() || meta?.stain?.trim()
	return suffix ? `${channel} (${suffix})` : channel
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

/** Título do eixo do plot: label e escala dividem o mesmo parêntese —
 * `"FL11-A (F4/80 · biex)"`. Sem label, `"FL11-A (biex)"` como antes. */
export const axisTitleLabel = (
	channel: string,
	file: Parameters<typeof channelLabelForFile>[1],
	scale: Scale,
): string => {
	const suffix =
		file?.channel_labels?.[channel]?.trim() ||
		file?.channel_meta?.find((m) => m.name === channel)?.stain?.trim()
	const parts = [suffix, scale === "linear" ? "" : scale].filter(Boolean)
	return parts.length ? `${channel} (${parts.join(" · ")})` : channel
}
