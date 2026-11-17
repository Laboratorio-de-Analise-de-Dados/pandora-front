export const SERVER_ERROR_MESSAGE = "Erro no servidor — tente novamente"

const HTML_TAG_PATTERN = /<\/?[a-zA-Z][^<>]*>/

/** String de erro que é na verdade uma página HTML (ex.: "Server Error
 * (500)" do Django) — nunca deve ser exibida crua ao usuário.
 */
const looksLikeHtml = (value: string): boolean => {
	const head = value.trimStart().slice(0, 200).toLowerCase()
	return (
		head.startsWith("<!doctype") ||
		head.startsWith("<html") ||
		HTML_TAG_PATTERN.test(value)
	)
}

/** Extrai a mensagem de erro de uma resposta axios/DRF.
 *
 * Cobre `detail`, erros de campo do serializer (`{ campo: ["..."] }`) e o
 * `message` do Error. Uso: `extractErrorMessage(error)` em catches.
 */
export const extractErrorMessage = (error: unknown): string => {
	const err = error as {
		response?: { data?: unknown }
		message?: string
	}
	const data = err?.response?.data
	if (data && typeof data === "object") {
		const detail = (data as { detail?: unknown }).detail
		if (typeof detail === "string") return detail
		const fieldErrors = Object.values(data as Record<string, unknown>)
			.flatMap((value) => (Array.isArray(value) ? value : [value]))
			.filter((value): value is string => typeof value === "string")
		if (fieldErrors.length > 0) return fieldErrors.join(" ")
	}
	if (typeof data === "string") {
		return looksLikeHtml(data) ? SERVER_ERROR_MESSAGE : data
	}
	return err?.message ?? String(error)
}

/** Classifica se o erro de API deve virar toast global "Erro no servidor":
 * status 5xx, corpo de erro não-JSON (HTML do Django/proxy) ou falha de
 * rede sem resposta. Erros 4xx com JSON de domínio seguem o fluxo
 * contextual do chamador.
 */
export const shouldToastServerError = (error: unknown): boolean => {
	const response = (
		error as {
			response?: {
				status?: number
				headers?: Record<string, unknown> & {
					get?: (name: string) => unknown
				}
			}
		}
	)?.response
	if (!response) return true
	if ((response.status ?? 0) >= 500) return true
	const headers = response.headers
	const contentType =
		typeof headers?.get === "function"
			? headers.get("content-type")
			: headers?.["content-type"]
	return (
		typeof contentType !== "string" ||
		!contentType.toLowerCase().includes("json")
	)
}
