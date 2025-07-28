import { DependencyList, useMemo } from 'react'
import { compose } from './compose.js'
import { ComposedFns, OptionsMap } from './types.js'

export function useComposableProps<T extends Record<string, any>>(
  props: T,
  options?: OptionsMap<T>,
  deps?: DependencyList,
): ComposedFns<T> {
  return useMemo(
    () => {
      const composed = {} as ComposedFns<T>

      for (const key in props) {
        const value = props[key]
        const option = options?.[key]
        // @ts-expect-error
        ;(composed as any)[key] = compose(value, option)
      }

      return composed
    },
    deps ?? [props, options],
  )
}
