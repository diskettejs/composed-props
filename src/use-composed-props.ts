import { DependencyList, useMemo } from 'react'
import { compose } from './compose.js'
import { OptionsMap, ResolvedProps, StateMap } from './types.js'

export function useComposedProps<T extends Record<string, any>>(
  props: T,
  state: StateMap<T>,
  options?: OptionsMap<T>,
  deps?: DependencyList,
): ResolvedProps<T> {
  return useMemo(
    () => {
      const resolved = {} as ResolvedProps<T>

      for (const key in props) {
        const value = props[key]
        const stateForKey = state[key]
        const option = options?.[key]

        // @ts-expect-error - TypeScript has trouble with the complex mapped types
        resolved[key] = compose(value, option)(stateForKey)
      }

      return resolved
    },
    deps ?? [props, state, options],
  )
}
