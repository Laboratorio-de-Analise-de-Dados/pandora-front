import { describe, expect, it } from "vitest"
import { checkpointLabel, formatSessionLabel, formatTime } from "./datetime"

describe("formatTime", () => {
	it("formata horário curto com zero à esquerda", () => {
		expect(formatTime(new Date(2026, 8, 15, 14, 5).toISOString())).toBe("14:05")
	})
})

describe("formatSessionLabel", () => {
	it("usa 'Hoje' para sessão do dia corrente", () => {
		const now = new Date()
		const start = new Date(now.getTime() - 25 * 60000).toISOString()
		const end = now.toISOString()
		expect(formatSessionLabel(start, end)).toMatch(/^Hoje · \d{2}:\d{2}/)
	})

	it("inclui intervalo quando início e fim diferem", () => {
		const label = formatSessionLabel(
			new Date(2026, 8, 14, 18, 10).toISOString(),
			new Date(2026, 8, 14, 18, 32).toISOString(),
		)
		expect(label).toContain("18:10–18:32")
	})

	it("usa 'Ontem' para o dia anterior", () => {
		const yesterday = new Date(Date.now() - 86400000)
		const iso = yesterday.toISOString()
		expect(formatSessionLabel(iso, iso)).toContain("Ontem")
	})
})

describe("checkpointLabel", () => {
	it("usa a mensagem quando presente", () => {
		expect(checkpointLabel("Pré-processamento", "2026-09-15T10:00:00Z")).toBe(
			"Pré-processamento",
		)
	})

	it("gera rótulo com data/hora quando a mensagem é vazia", () => {
		expect(checkpointLabel("", "2026-09-15T10:00:00Z")).toMatch(
			/^Checkpoint \d{2}\/\w{3} \d{2}:\d{2}$/,
		)
	})
})
