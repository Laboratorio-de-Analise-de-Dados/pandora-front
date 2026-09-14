import { describe, expect, it } from "vitest"
import { extractErrorMessage } from "./apiError"

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
})
