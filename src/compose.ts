import { ComposeOptions } from './types.js'

export function compose<U, V>(
	value: V | ((props: U) => V) | undefined,
	options?: ComposeOptions<V, U, V>,
): (props: U) => V {
	return (renderProps) => {
		let result: V | undefined
		if (typeof value === 'function') {
			result = (value as (props: U) => V)(renderProps)
		} else {
			result = value
		}

		if (typeof result === 'undefined' && options?.fallback) {
			result = options.fallback(renderProps)
		}

		if (options?.transform && result !== undefined) {
			result = options.transform(result, renderProps)
		}

		return result as V
	}
}
