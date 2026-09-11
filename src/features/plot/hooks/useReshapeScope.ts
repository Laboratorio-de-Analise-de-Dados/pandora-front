import { useCallback, useState } from "react"
import type { GateScope } from "../../../services/gateService"
import type { GateCoordinates } from "../../../types"

interface PendingReshape {
	gateId: number
	coords: GateCoordinates
	familySize: number
	resolve: () => void
}

/**
 * Intercepta o salvamento da geometria de um gate que faz parte de uma família
 * de cópias para perguntar o escopo: só nesta amostra (o gate sai da família) ou
 * em todas (a família inteira recebe a nova geometria). Gates sem família são
 * salvos direto.
 */
export function useReshapeScope(
	patchCoordinates: (
		gateId: number,
		coords: GateCoordinates,
		scope?: GateScope,
	) => Promise<void>,
	familySizeOf: (gateId: number) => number,
	onDiscard: () => void,
) {
	const [pending, setPending] = useState<PendingReshape | null>(null)

	const requestPatch = useCallback(
		async (gateId: number, coords: GateCoordinates) => {
			const familySize = familySizeOf(gateId)
			if (familySize < 2) {
				await patchCoordinates(gateId, coords)
				return
			}
			await new Promise<void>((resolve) => {
				setPending({ gateId, coords, familySize, resolve })
			})
		},
		[familySizeOf, patchCoordinates],
	)

	const confirm = useCallback(
		async (scope: GateScope) => {
			if (!pending) return
			setPending(null)
			await patchCoordinates(pending.gateId, pending.coords, scope)
			pending.resolve()
		},
		[patchCoordinates, pending],
	)

	const cancel = useCallback(() => {
		if (!pending) return
		setPending(null)
		onDiscard()
		pending.resolve()
	}, [onDiscard, pending])

	return { pending, requestPatch, confirm, cancel }
}
