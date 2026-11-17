import { describe, expect, it } from "vitest"
import {
	SERVER_ERROR_MESSAGE,
	extractErrorMessage,
	shouldToastServerError,
} from "./apiError"

describe("extractErrorMessage", () => {
	it("lê detail do corpo DRF", () => {
		const err = { response: { data: { detail: "Sem permissão." } } }
		expect(extractErrorMessage(err)).toBe("Sem permissão.")
	})

	it("junta erros de campo do serializer", () => {
		const err = {
			response: { data: { title: ["obrigatório"], type: ["inválido"] } },
		}
		expect(extractErrorMessage(err)).toBe("obrigatório inválido")
	})

	it("cai no message do Error quando não há response", () => {
		expect(extractErrorMessage(new Error("falhou"))).toBe("falhou")
	})

	it("devolve string do body quando o data é texto", () => {
		const err = { response: { data: "erro cru" } }
		expect(extractErrorMessage(err)).toBe("erro cru")
	})

	it("devolve mensagem genérica quando o body é a página HTML do Django", () => {
		const html =
			"<!DOCTYPE html>\n<html><body><h1>Server Error (500)</h1></body></html>"
		const err = { response: { data: html } }
		expect(extractErrorMessage(err)).toBe(SERVER_ERROR_MESSAGE)
	})

	it("devolve mensagem genérica quando a string contém tag HTML", () => {
		const err = {
			response: { data: "  <html><body>Bad Gateway</body></html>" },
		}
		expect(extractErrorMessage(err)).toBe(SERVER_ERROR_MESSAGE)
	})
})

describe("shouldToastServerError", () => {
	it("sinaliza 5xx com corpo HTML", () => {
		const err = {
			response: {
				status: 500,
				headers: { "content-type": "text/html" },
			},
		}
		expect(shouldToastServerError(err)).toBe(true)
	})

	it("não sinaliza 4xx com corpo JSON de domínio", () => {
		const err = {
			response: {
				status: 400,
				headers: { "content-type": "application/json" },
				data: { detail: "campo inválido" },
			},
		}
		expect(shouldToastServerError(err)).toBe(false)
	})

	it("sinaliza falha de rede sem resposta", () => {
		expect(shouldToastServerError(new Error("Network Error"))).toBe(true)
	})

	it("sinaliza resposta de erro sem corpo JSON mesmo em 4xx", () => {
		const err = {
			response: {
				status: 404,
				headers: { "content-type": "text/html" },
			},
		}
		expect(shouldToastServerError(err)).toBe(true)
	})
})
