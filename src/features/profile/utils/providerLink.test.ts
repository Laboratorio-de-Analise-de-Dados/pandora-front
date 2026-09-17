import { describe, expect, it } from "vitest"
import {
	linkFeedbackFromParams,
	mergeNoticeFromParams,
	providerLabel,
} from "./providerLink"

describe("providerLabel", () => {
	it("mapeia providers conhecidos", () => {
		expect(providerLabel("google")).toBe("Google")
		expect(providerLabel("microsoft")).toBe("Microsoft")
	})

	it("devolve o próprio valor para provider desconhecido", () => {
		expect(providerLabel("github")).toBe("github")
	})
})

describe("linkFeedbackFromParams", () => {
	it("sucesso quando linked está presente", () => {
		const params = new URLSearchParams("linked=google")
		expect(linkFeedbackFromParams(params)).toEqual({
			severity: "success",
			message: "Conta Google conectada.",
		})
	})

	it("conflito de identidade vinculada a outra conta", () => {
		const params = new URLSearchParams("link_error=conflict")
		const feedback = linkFeedbackFromParams(params)
		expect(feedback?.severity).toBe("error")
		expect(feedback?.message).toContain("outra conta")
	})

	it("identidade inválida do provedor", () => {
		const params = new URLSearchParams("link_error=no_sub")
		expect(linkFeedbackFromParams(params)?.message).toContain("identidade")
	})

	it("erro desconhecido cai no genérico", () => {
		const params = new URLSearchParams("link_error=timeout")
		expect(linkFeedbackFromParams(params)?.message).toContain(
			"Não foi possível",
		)
	})

	it("sem params retorna null", () => {
		expect(linkFeedbackFromParams(new URLSearchParams())).toBeNull()
	})
})

describe("mergeNoticeFromParams", () => {
	it("extrai provider, email e token do aviso", () => {
		const params = new URLSearchParams(
			"merge_notice=1&provider=microsoft&email=abs%40x.com&token=tok123",
		)
		expect(mergeNoticeFromParams(params)).toEqual({
			provider: "microsoft",
			email: "abs@x.com",
			token: "tok123",
		})
	})

	it("sem merge_notice retorna null", () => {
		expect(
			mergeNoticeFromParams(new URLSearchParams("linked=google")),
		).toBeNull()
	})

	it("merge_notice sem token retorna null", () => {
		const params = new URLSearchParams("merge_notice=1&provider=google")
		expect(mergeNoticeFromParams(params)).toBeNull()
	})
})
