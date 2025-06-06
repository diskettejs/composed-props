import { useMemo } from 'react'
import {
	composeRender,
	type ComposableProp,
	type ComposeOptions,
} from './compose-render.js'

export type ComposedFns<T, K extends readonly (keyof T)[]> = {
	[P in K[number]]: T[P] extends ComposableProp<infer S, infer R>
		? (state: S) => R
		: never
}

export type OptionsMap<T, K extends readonly (keyof T)[]> = {
	[P in K[number]]?: T[P] extends ComposableProp<infer S, infer R>
		? ComposeOptions<R, S, R>
		: never
}

export function useComposableProps<
	T extends Record<string, any>,
	const K extends readonly (keyof T)[],
>(
	props: T,
	keys: K,
	options?: OptionsMap<T, K>,
): { render: ComposedFns<T, K>; rest: Omit<T, K[number]> } {
	return useMemo(() => {
		const render = {} as ComposedFns<T, K>
		const rest = { ...props } as Omit<T, K[number]>

		for (const key of keys) {
			const value = props[key]
			const option = options?.[key]
			;(render as any)[key] = composeRender(value, option)
			delete (rest as any)[key]
		}

		return { render, rest }
	}, [props, keys, options])
}
