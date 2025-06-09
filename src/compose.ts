import { ComposeOptions } from './types.js'

export function compose<T, U, V extends T>(
	value: T extends any ? T | ((props: U) => V) : never,
	options?: ComposeOptions<T, U, V>,
): (props: U) => V {
	return (renderProps) => {
		let result = typeof value === 'function' ? value(renderProps) : value

		if (typeof value === 'undefined' && options?.fallback) {
			result = options.fallback(renderProps)
		}

		if (options?.transform) {
			result = options.transform(result, renderProps)
		}

		return result
	}
}
