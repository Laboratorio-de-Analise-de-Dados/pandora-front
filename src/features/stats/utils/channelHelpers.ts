const SCATTER_CHANNELS = ["fsc", "ssc", "time"]

export const isFluorescence = (ch: string): boolean =>
	!SCATTER_CHANNELS.some((s) => ch.toLowerCase().startsWith(s))

export const normalizeChannelName = (name: string): string =>
	name.toLowerCase().replace(/ /g, "").replace(/-/g, "_")
