import { useMemo } from 'react'
import { compose } from './compose.js'
import { ComposedFns, OptionsMap } from './types.js'

export function useComposableProps<
	T extends Record<string, any>,
	const K extends readonly (keyof T)[],
>(
	props: T,
	keys: K,
	options?: OptionsMap<T, K>,
): { composed: ComposedFns<T, K>; rest: Omit<T, K[number]> } {
	return useMemo(() => {
		const composed = {} as ComposedFns<T, K>
		const rest = { ...props } as Omit<T, K[number]>

		for (const key of keys) {
			const value = props[key]
			const option = options?.[key]
			;(composed as any)[key] = compose(value, option)
			delete (rest as any)[key]
		}

		return { composed, rest }
	}, [props, keys, options])
}
