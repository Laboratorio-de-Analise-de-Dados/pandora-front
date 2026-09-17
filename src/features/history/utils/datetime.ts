/** Formatação da timeline de histórico (FE-25) — TS puro, sem React. */

const MONTHS = [
	"Jan",
	"Fev",
	"Mar",
	"Abr",
	"Mai",
	"Jun",
	"Jul",
	"Ago",
	"Set",
	"Out",
	"Nov",
	"Dez",
]

const pad = (n: number) => String(n).padStart(2, "0")

/** "14:32" — horário curto usado nas linhas de revisão. */
export const formatTime = (iso: string): string => {
	const d = new Date(iso)
	return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "15/Set" — dia + mês abreviado. */
export const formatDay = (iso: string): string => {
	const d = new Date(iso)
	return `${pad(d.getDate())}/${MONTHS[d.getMonth()]}`
}

const isSameDay = (a: Date, b: Date) =>
	a.getFullYear() === b.getFullYear() &&
	a.getMonth() === b.getMonth() &&
	a.getDate() === b.getDate()

/**
 * Rótulo do cabeçalho de sessão: "Hoje · 14:20–14:45", "Ontem · 18:10" ou
 * "15/Set · 09:00–09:12". `ended`/`started` vêm do backend (ISO).
 */
export const formatSessionLabel = (started: string, ended: string): string => {
	const start = new Date(started)
	const end = new Date(ended)
	const now = new Date()
	const range =
		started === ended
			? formatTime(started)
			: `${formatTime(started)}–${formatTime(ended)}`
	const day = isSameDay(end, now)
		? "Hoje"
		: isSameDay(end, new Date(now.getTime() - 86400000))
			? "Ontem"
			: formatDay(ended)
	return `${day} · ${range}`
}

/**
 * Rótulo relativo curto: "Agora mesmo", "Há 25 min", "Há 3 h" ou
 * "15/Set · 09:00" quando passa de um dia. Usa o fuso do browser.
 */
export const formatRelativeTime = (iso: string): string => {
	const diffMin = Math.floor(
		(new Date().getTime() - new Date(iso).getTime()) / 60000,
	)
	if (diffMin < 1) return "Agora mesmo"
	if (diffMin < 60) return `Há ${diffMin} min`
	const diffH = Math.floor(diffMin / 60)
	if (diffH < 24) return `Há ${diffH} h`
	return `${formatDay(iso)} · ${formatTime(iso)}`
}

/**
 * Rótulo de checkpoint sem mensagem — espelha o fallback do backend
 * ("Checkpoint <data/hora>") para o pin sem nome.
 */
export const checkpointLabel = (
	message: string | null | undefined,
	createdAt: string,
): string =>
	message?.trim() ||
	`Checkpoint ${formatDay(createdAt)} ${formatTime(createdAt)}`
