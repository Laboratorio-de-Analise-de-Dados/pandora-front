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
	if (typeof data === "string") return data
	return err?.message ?? String(error)
}
