import { describe, expect, it } from "vitest"
import type { ExperimentFiles } from "../../../types"
import { buildSubsampleMoves } from "./subsampleMoves"

const file = (id: number, subsample: number | null = null) =>
	({ id, subsample }) as Pick<ExperimentFiles, "id" | "subsample">

describe("buildSubsampleMoves (FE-53/BE-48)", () => {
	it("monta {moves:[{file_id, subsample}]} da seleção", () => {
		const files = [file(1), file(2), file(3)]
		expect(buildSubsampleMoves(files, [1, 3], 7)).toEqual({
			moves: [
				{ file_id: 1, subsample: 7 },
				{ file_id: 3, subsample: 7 },
			],
		})
	})

	it("destino null desagrupa", () => {
		const files = [file(1, 7), file(2, 7)]
		expect(buildSubsampleMoves(files, [1, 2], null)).toEqual({
			moves: [
				{ file_id: 1, subsample: null },
				{ file_id: 2, subsample: null },
			],
		})
	})

	it("no-op quando todas já estão no destino — null, sem request", () => {
		const files = [file(1, 7), file(2, 7)]
		expect(buildSubsampleMoves(files, [1, 2], 7)).toBeNull()
		expect(buildSubsampleMoves([file(1)], [1], null)).toBeNull()
	})

	it("ignora quem já está no destino e move só o resto", () => {
		const files = [file(1, 7), file(2, 3)]
		expect(buildSubsampleMoves(files, [1, 2], 7)).toEqual({
			moves: [{ file_id: 2, subsample: 7 }],
		})
	})

	it("id selecionado ausente da lista não entra no payload", () => {
		expect(buildSubsampleMoves([file(1)], [1, 99], 7)).toEqual({
			moves: [{ file_id: 1, subsample: 7 }],
		})
	})
})
