import { DependencyList, useMemo } from 'react'
import { compose } from './compose.js'
import { OptionsMap, ResolvedProps } from './types.js'

export function useComposedProps<
	T extends Record<string, any>,
	U extends Record<string, any>,
>(
	props: T,
	state: U,
	options?: OptionsMap<T>,
	deps: DependencyList = [props, state, options],
): ResolvedProps<T, U> {
	return useMemo(() => {
		const resolved = {} as ResolvedProps<T, U>

		for (const key in props) {
			if (props.hasOwnProperty(key)) {
				const value = props[key]
				const option = options?.[key]
				// @ts-expect-error
				const composedFn = compose(value, option)
				;(resolved as any)[key] = composedFn(state)
			}
		}

		return resolved
	}, deps)
}
