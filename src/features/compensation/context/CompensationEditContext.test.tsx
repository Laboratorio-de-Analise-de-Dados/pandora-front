import { renderHook, act } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import type { CompensationMatrix } from "../../../services/compensationService"

// O provider lê `values` do workspace pra montar a identidade do
// modo "nova matriz" — mocka só esse pedaço.
vi.mock("../../experiment/context/ExperimentWorkspaceContext", () => ({
	useExperimentWorkspace: () => ({
		values: ["FSC-A", "SSC-A", "FITC-A", "PE-A"],
	}),
}))

import {
	CompensationEditProvider,
	useCompensationEdit,
} from "./CompensationEditContext"

const wrapper = ({ children }: { children: ReactNode }) => (
	<CompensationEditProvider>{children}</CompensationEditProvider>
)

const BASE_MATRIX: CompensationMatrix = {
	id: 7,
	name: "base",
	channels: ["FITC-A", "PE-A"],
	matrix: [
		[1, 0.12],
		[0.03, 1],
	],
	source: "manual",
	is_applied: false,
	derived_from: null,
	derived_from_name: null,
	created_by_name: "eu",
	created_at: "2026-01-01T00:00:00Z",
}

describe("CompensationEditContext", () => {
	it("nova matriz abre com canais fluorescentes e identidade", () => {
		const { result } = renderHook(() => useCompensationEdit(), { wrapper })
		expect(result.current.editing).toBeNull()

		act(() => result.current.startEditing(null))
		expect(result.current.editing?.channels).toEqual(["FITC-A", "PE-A"])
		expect(result.current.matrix).toEqual([
			[1, 0],
			[0, 1],
		])
	})

	it("ajuste copia nome/canais/células da matriz de origem", () => {
		const { result } = renderHook(() => useCompensationEdit(), { wrapper })
		act(() => result.current.startEditing(BASE_MATRIX))
		expect(result.current.editing?.base?.id).toBe(7)
		expect(result.current.editing?.name).toBe("base (ajustada)")
		expect(result.current.matrix?.[0][1]).toBeCloseTo(0.12)
		expect(result.current.changed.size).toBe(0)
	})

	it("célula inválida marca o campo e congela a matriz na última válida", () => {
		const { result } = renderHook(() => useCompensationEdit(), { wrapper })
		act(() => result.current.startEditing(BASE_MATRIX))
		// Células editam em %: "30" = 30% de spillover = 0.30 em fração.
		act(() => result.current.setCell(0, 1, "30"))
		expect(result.current.matrix?.[0][1]).toBeCloseTo(0.3)

		// Célula vazada pra redigitar fica inválida — a prévia segue na
		// última válida em vez de zerar/apagar o gráfico.
		act(() => result.current.setCell(0, 1, ""))
		expect(result.current.invalid.has("0,1")).toBe(true)
		expect(result.current.matrix?.[0][1]).toBeCloseTo(0.3)
	})

	it("cancelar descarta o rascunho", () => {
		const { result } = renderHook(() => useCompensationEdit(), { wrapper })
		act(() => result.current.startEditing(BASE_MATRIX))
		act(() => result.current.cancelEditing())
		expect(result.current.editing).toBeNull()
		expect(result.current.matrix).toBeNull()
	})
})
