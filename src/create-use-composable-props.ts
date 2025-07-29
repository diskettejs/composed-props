import { DependencyList } from 'react'
import { ComposedFns, OptionsMap } from './types.js'
import { useComposableProps } from './use-composable-props.js'

/**
 * Creates a reusable composable props hook with whitelisted properties.
 *
 * Returns a custom hook that only creates resolver functions for the specified
 * whitelisted properties, while passing through all other properties unchanged.
 * This provides better performance and type safety by limiting which props get
 * the composable treatment.
 *
 * @example
 * ```tsx
 * // Create a hook that only makes children, style, and className composable
 * const useRenderProps = createUseComposableProps([
 *   "children",
 *   "style",
 *   "className"
 * ] as const)
 *
 * // Usage in component
 * function MyComponent(props) {
 *   const composed = useRenderProps(props, {
 *     className: { fallback: () => 'default-class' }
 *   })
 *
 *   return (
 *     <div
 *       className={composed.className(state)}
 *       style={composed.style(state)}
 *       onClick={props.onClick} // passed through unchanged
 *     >
 *       {composed.children(state)}
 *     </div>
 *   )
 * }
 * ```
 */
export function createUseComposableProps<
  const TWhitelist extends readonly string[],
>(whitelist: TWhitelist) {
  return function useComposablePropsWithWhitelist<
    T extends Record<string, any>,
  >(
    props: T,
    options?: OptionsMap<Pick<T, TWhitelist[number] & keyof T>>,
    deps?: DependencyList,
  ): ComposedFns<Pick<T, TWhitelist[number] & keyof T>> &
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

    // Create composed functions for whitelisted props
    const composed = useComposableProps(whitelistedProps, options, deps)

    // Return combined object with composed functions and pass-through props
    return {
      ...composed,
      ...passThrough,
    } as ComposedFns<Pick<T, TWhitelist[number] & keyof T>> &
      Omit<T, TWhitelist[number]>
  }
}
