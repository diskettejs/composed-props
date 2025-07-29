import { DependencyList } from 'react'
import { OptionsMap, ResolvedProps, StateMap } from './types.js'
import { useComposedProps } from './use-composed-props.js'

/**
 * Creates a reusable composed props hook with whitelisted properties.
 *
 * Returns a custom hook that only resolves the specified whitelisted properties
 * as ComposableProp values, while passing through all other properties unchanged.
 * This provides better performance and type safety by limiting which props get
 * the composable treatment and pre-resolving them with provided state.
 *
 * @example
 * ```tsx
 * // Create a hook that only makes children, style, and className composable
 * const useRenderProps = createUseComposedProps([
 *   "children",
 *   "style",
 *   "className"
 * ])
 *
 * // Usage in component
 * function MyComponent(props) {
 *   const resolved = useRenderProps(
 *     props,
 *     {
 *       className: state,
 *       style: state,
 *       children: state
 *     },
 *     {
 *       className: { fallback: () => 'default-class' }
 *     }
 *   )
 *
 *   return (
 *     <div
 *       className={resolved.className}
 *       style={resolved.style}
 *       onClick={props.onClick} // passed through unchanged
 *     >
 *       {resolved.children}
 *     </div>
 *   )
 * }
 * ```
 */
export function createUseComposedProps<
  const TWhitelist extends readonly string[],
>(whitelist: TWhitelist) {
  return function useComposedPropsWithWhitelist<T extends Record<string, any>>(
    props: T,
    state: StateMap<Pick<T, TWhitelist[number] & keyof T>>,
    options?: OptionsMap<Pick<T, TWhitelist[number] & keyof T>>,
    deps?: DependencyList,
  ): ResolvedProps<Pick<T, TWhitelist[number] & keyof T>> &
    Omit<T, TWhitelist[number]> {
    // Extract whitelisted props for composition
    const whitelistedProps = {} as Pick<T, TWhitelist[number] & keyof T>
    const passThrough = {} as Omit<T, TWhitelist[number]>

    for (const key in props) {
      if (whitelist.includes(key)) {
        ;(whitelistedProps as any)[key] = props[key]
      } else {
        ;(passThrough as any)[key] = props[key]
      }
    }

    // Resolve whitelisted props using useComposedProps
    const resolved = useComposedProps(whitelistedProps, state, options, deps)

    // Return combined object with resolved props and pass-through props
    return {
      ...resolved,
      ...passThrough,
    } as ResolvedProps<Pick<T, TWhitelist[number] & keyof T>> &
      Omit<T, TWhitelist[number]>
  }
}
