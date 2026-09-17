export const PROVIDER_LABELS: Record<string, string> = {
	google: "Google",
	microsoft: "Microsoft",
}

export function providerLabel(provider: string): string {
	return PROVIDER_LABELS[provider] ?? provider
}

export interface LinkFeedback {
	severity: "success" | "error"
	message: string
}

export interface MergeNotice {
	provider: string
	email: string
	token: string
}

/** Lê o aviso de merge que o backend devolve quando a identidade do IdP
 * já pertence a outra conta (?merge_notice=1&provider=&email=&token=). */
export function mergeNoticeFromParams(
	params: URLSearchParams,
): MergeNotice | null {
	if (params.get("merge_notice") !== "1") return null
	const token = params.get("token")
	if (!token) return null
	return {
		provider: params.get("provider") ?? "",
		email: params.get("email") ?? "",
		token,
	}
}

/** Traduz os query params que o backend devolve no redirect pós-link
 * (?linked=<provider> ou ?link_error=<motivo>) em mensagem de snackbar. */
export function linkFeedbackFromParams(
	params: URLSearchParams,
): LinkFeedback | null {
	const linked = params.get("linked")
	if (linked) {
		return {
			severity: "success",
			message: `Conta ${providerLabel(linked)} conectada.`,
		}
	}
	const error = params.get("link_error")
	if (!error) return null
	if (error === "conflict") {
		return {
			severity: "error",
			message:
				"Esta identidade já está vinculada a outra conta. Entre com ela ou fale com o suporte.",
		}
	}
	if (error === "no_sub") {
		return {
			severity: "error",
			message:
				"O provedor não retornou uma identidade válida. Tente novamente.",
		}
	}
	return {
		severity: "error",
		message: "Não foi possível conectar a conta. Tente novamente.",
	}
}
