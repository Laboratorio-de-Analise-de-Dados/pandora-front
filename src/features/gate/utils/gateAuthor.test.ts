import { describe, expect, it } from "vitest"
import type { Gate } from "../../../types"
import { gateAuthorLabel } from "./gateAuthor"

const gate = (extra: Partial<Gate>): Gate =>
	({ id: 1, name: "P1", ...extra }) as Gate

describe("gateAuthorLabel", () => {
	it("junta autor e data", () => {
		expect(
			gateAuthorLabel(
				gate({ created_by_name: "Ana", created_at: "2026-03-10T12:00:00Z" }),
			),
		).toBe("Criado por Ana em 10/03/2026")
	})

	it("mostra só o autor quando não há data", () => {
		expect(gateAuthorLabel(gate({ created_by_name: "Ana" }))).toBe(
			"Criado por Ana",
		)
	})

	it("não inventa autor para gates antigos", () => {
		expect(gateAuthorLabel(gate({}))).toBeNull()
		expect(gateAuthorLabel(gate({ created_by_name: null }))).toBeNull()
	})
})
