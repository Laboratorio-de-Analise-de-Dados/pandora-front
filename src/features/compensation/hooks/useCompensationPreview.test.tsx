import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../../services/compensationService", async (importOriginal) => {
	const mod =
		await importOriginal<
			typeof import("../../../services/compensationService")
		>()
	return {
		...mod,
		previewCompensation: vi.fn().mockResolvedValue({
			mode: "heatmap",
			total_events: 10,
			x_label: "x",
			y_label: "y",
			histogram: [[1]],
			x_edges: [0, 1],
			y_edges: [0, 1],
		}),
	}
})

import { previewCompensation } from "../../../services/compensationService"
import {
	PREVIEW_DEBOUNCE_MS,
	useCompensationPreview,
} from "./useCompensationPreview"

const mockedPreview = vi.mocked(previewCompensation)

const wrapper = ({ children }: { children: ReactNode }) => (
	<QueryClientProvider
		client={
			new QueryClient({
				defaultOptions: { queries: { retry: false } },
			})
		}
	>
		{children}
	</QueryClientProvider>
)

const BASE = {
	experimentId: 1,
	channels: ["FITC-A", "PE-A"],
	matrix: [
		[1, 0.12],
		[0.03, 1],
	] as number[][] | null,
	fileId: 42 as number | undefined,
	xAxis: "FITC-A",
	yAxis: "PE-A",
	enabled: true,
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

beforeEach(() => mockedPreview.mockClear())

describe("useCompensationPreview", () => {
	it("monta o payload do contrato BE-36 e dispara ao montar", async () => {
		renderHook(() => useCompensationPreview(BASE), { wrapper })
		await waitFor(() => expect(mockedPreview).toHaveBeenCalledTimes(1), {
			timeout: PREVIEW_DEBOUNCE_MS * 4,
		})
		expect(mockedPreview).toHaveBeenCalledWith(1, {
			channels: ["FITC-A", "PE-A"],
			matrix: [
				[1, 0.12],
				[0.03, 1],
			],
			file: 42,
			x_axis: "FITC-A",
			y_axis: "PE-A",
			params: {
				mode: "heatmap",
				bins: 120,
				cutoff: 0,
				xscale: "biex",
				yscale: "biex",
				cofactor: 150,
			},
		})
	})

	it("grade inválida (matrix null) não dispara request", async () => {
		renderHook(() => useCompensationPreview({ ...BASE, matrix: null }), {
			wrapper,
		})
		await sleep(PREVIEW_DEBOUNCE_MS * 2)
		expect(mockedPreview).not.toHaveBeenCalled()
	})

	it("toggle desligado não dispara request", async () => {
		renderHook(() => useCompensationPreview({ ...BASE, enabled: false }), {
			wrapper,
		})
		await sleep(PREVIEW_DEBOUNCE_MS * 2)
		expect(mockedPreview).not.toHaveBeenCalled()
	})

	it("sem amostra selecionada não dispara request", async () => {
		renderHook(() => useCompensationPreview({ ...BASE, fileId: undefined }), {
			wrapper,
		})
		await sleep(PREVIEW_DEBOUNCE_MS * 2)
		expect(mockedPreview).not.toHaveBeenCalled()
	})

	it("edições rápidas viram uma única request com a última matriz", async () => {
		const { rerender } = renderHook(
			({ matrix }) => useCompensationPreview({ ...BASE, matrix }),
			{ wrapper, initialProps: { matrix: BASE.matrix } },
		)
		// Montagem dispara a primeira request direto (sem debounce).
		await waitFor(() => expect(mockedPreview).toHaveBeenCalledTimes(1), {
			timeout: PREVIEW_DEBOUNCE_MS * 4,
		})

		const latest = [
			[1, 0.5],
			[0.03, 1],
		]
		rerender({
			matrix: [
				[1, 0.4],
				[0.03, 1],
			],
		})
		rerender({ matrix: latest })
		await waitFor(() => expect(mockedPreview).toHaveBeenCalledTimes(2), {
			timeout: PREVIEW_DEBOUNCE_MS * 4,
		})
		expect(mockedPreview).toHaveBeenLastCalledWith(
			1,
			expect.objectContaining({ matrix: latest }),
		)
		// Nenhuma chamada extra pela matriz intermediária.
		await sleep(PREVIEW_DEBOUNCE_MS * 2)
		expect(mockedPreview).toHaveBeenCalledTimes(2)
	})
})
