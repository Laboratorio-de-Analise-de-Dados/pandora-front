import { describe, expect, it } from "vitest"
import {
	findDuplicateFileNames,
	formatFileSize,
	isAcceptedExperimentFile,
} from "./experimentFile"

const fakeFile = (name: string) => new File(["x"], name)

describe("isAcceptedExperimentFile", () => {
	it("aceita .fcs e .zip em qualquer caixa", () => {
		expect(isAcceptedExperimentFile("amostra.fcs")).toBe(true)
		expect(isAcceptedExperimentFile("LOTE.ZIP")).toBe(true)
	})

	it("rejeita outras extensões", () => {
		expect(isAcceptedExperimentFile("amostra.csv")).toBe(false)
		expect(isAcceptedExperimentFile("amostra.fcs.zip.bak")).toBe(false)
		expect(isAcceptedExperimentFile("amostra")).toBe(false)
		expect(isAcceptedExperimentFile("")).toBe(false)
	})
})

describe("findDuplicateFileNames", () => {
	it("retorna nomes repetidos na seleção", () => {
		const files = [fakeFile("a.fcs"), fakeFile("b.fcs"), fakeFile("a.fcs")]
		expect(findDuplicateFileNames(files)).toEqual(["a.fcs"])
	})

	it("detecta colisão por caixa diferente e preserva a 1ª grafia", () => {
		const files = [fakeFile("Tube_1.FCS"), fakeFile("tube_1.fcs")]
		expect(findDuplicateFileNames(files)).toEqual(["Tube_1.FCS"])
	})

	it("lista vazia quando não há duplicados", () => {
		const files = [fakeFile("a.fcs"), fakeFile("b.zip")]
		expect(findDuplicateFileNames(files)).toEqual([])
	})

	it("não repete o nome quando aparece 3+ vezes", () => {
		const files = [fakeFile("a.fcs"), fakeFile("a.fcs"), fakeFile("a.fcs")]
		expect(findDuplicateFileNames(files)).toEqual(["a.fcs"])
	})
})

describe("formatFileSize", () => {
	it("formata bytes, KB, MB e GB", () => {
		expect(formatFileSize(512)).toBe("512 B")
		expect(formatFileSize(2048)).toBe("2.0 KB")
		expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB")
		expect(formatFileSize(2 * 1024 ** 3)).toBe("2.0 GB")
	})
})
