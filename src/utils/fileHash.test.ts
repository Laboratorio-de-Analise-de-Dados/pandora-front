import { describe, expect, it } from "vitest"
import { sha256File } from "./fileHash"

// Vetor de referência: sha256("pandora") — verificável com `echo -n pandora | sha256sum`.
const PANDORA_SHA256 =
	"5a7b2e919d9eb13cbcfcdaa0bda8bf6aec156a00e29448e96f1702676f70b119"

describe("sha256File", () => {
	it("gera o hash hex de 64 caracteres do conteúdo", async () => {
		const file = new File(["pandora"], "amostras.zip")
		const hash = await sha256File(file)

		expect(hash).toMatch(/^[0-9a-f]{64}$/)
		expect(hash).toEqual(PANDORA_SHA256)
	})

	it("conteúdos diferentes geram hashes diferentes", async () => {
		const a = await sha256File(new File(["abc"], "a.fcs"))
		const b = await sha256File(new File(["abd"], "b.fcs"))
		expect(a).not.toEqual(b)
	})
})
