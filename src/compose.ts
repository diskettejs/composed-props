import { ComposeOptions } from './types.js'

export function compose<U, V>(
  value: V | ((props: U, defaultValue?: V) => V) | undefined,
  options?: ComposeOptions<V, U, V>,
): (props: U) => V {
  return (renderProps) => {
    const resolvedDefault =
      typeof options?.default === 'function'
        ? (options.default as (props: U) => V)(renderProps)
        : options?.default

    let result: V | undefined
    if (typeof value === 'function') {
      result = (value as (props: U, defaultValue?: V) => V)(
        renderProps,
        resolvedDefault,
      )
    } else {
      result = value
    }

    if (typeof result === 'undefined' && options?.fallback) {
      result = options.fallback(renderProps, resolvedDefault)
    }

    if (typeof result === 'undefined' && resolvedDefault !== undefined) {
      result = resolvedDefault
    }

    if (options?.transform && result !== undefined) {
      result = options.transform(result, renderProps, resolvedDefault)
    }

    return result as V
  }
}
