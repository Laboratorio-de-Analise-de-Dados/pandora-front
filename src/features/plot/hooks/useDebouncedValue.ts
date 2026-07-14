import { useEffect, useState } from "react"

/**
 * Retorna uma cópia atrasada de `value`, que só acompanha o valor atual depois
 * que ele fica estável por `delayMs`. Usado para adiar o refetch do gráfico
 * enquanto o usuário ainda está arrastando os limites dos eixos.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value)

	useEffect(() => {
		const handle = setTimeout(() => setDebounced(value), delayMs)
		return () => clearTimeout(handle)
	}, [value, delayMs])

	return debounced
}
