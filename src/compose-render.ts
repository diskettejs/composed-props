export type ComposableProp<T, V> = V | ((props: T) => V)

export type ComposeOptions<T, U, V extends T> = {
	fallback?: (renderProps: U) => V
	render?: (prevValue: T, renderProps: U) => V
	transform?: (prevValue: V, renderProps: U) => V
}

export function composeRender<T, U, V extends T>(
	value: T extends any ? T | ((renderProps: U) => V) : never,
	options?: ComposeOptions<T, U, V>,
): (renderProps: U) => V {
	return (renderProps) => {
		let result

		if (typeof value === 'function') {
			result = value(renderProps)
		} else {
			if (options?.render) {
				result = options.render(value as T, renderProps)
			} else {
				result = value
			}
		}
		if (typeof value === 'undefined' && options?.fallback) {
			result = options.fallback(renderProps)
		}

		if (options?.transform) {
			result = options.transform(result, renderProps)
		}

		return result
	}
}
