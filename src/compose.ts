import { ComposeOptions } from './types.js'

export function compose<U, V>(
  value: V | ((props: U, defaultValue?: V) => V) | undefined,
  options?: ComposeOptions<V, U, V>,
): (props: U) => V {
  return (renderProps) => {
    let result: V | undefined
    if (typeof value === 'function') {
      result = (value as (props: U, defaultValue?: V) => V)(
        renderProps,
        options?.default,
      )
    } else {
      result = value
    }

    if (typeof result === 'undefined' && options?.fallback) {
      result = options.fallback(renderProps, options?.default)
    }

    if (typeof result === 'undefined' && options?.default !== undefined) {
      result = options.default
    }

    if (options?.transform && result !== undefined) {
      result = options.transform(result, renderProps, options?.default)
    }

    return result as V
  }
}
