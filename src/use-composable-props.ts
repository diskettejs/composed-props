import { DependencyList, useMemo } from 'react'
import { compose } from './compose.js'
import { ComposedFns, OptionsMap } from './types.js'

/**
 * Transforms ComposableProp values into resolver functions that accept state parameters.
 *
 * Returns an object where each prop becomes a function that can be called with state
 * to resolve the prop's final value. The resolution applies any configured options
 * including fallback, transform, and default value logic.
 *
 * @param props - Object containing ComposableProp values to be transformed
 * @param options - Optional configuration map specifying fallback, transform, and default logic per prop
 * @param deps - Optional dependency array for memoization (defaults to [props, options])
 * @returns Object with resolver functions for each prop that accept state and return resolved values
 *
 * @example
 * ```tsx
 * import { useComposableProps, ComposableProp } from '@diskette/composed-props'
 *
 * interface LabelState {
 *   clickCount: number
 *   userName: string
 * }
 *
 * interface StyleState {
 *   isHovered: boolean
 *   isPressed: boolean
 *   theme: 'light' | 'dark'
 * }
 *
 * interface DisabledState {
 *   isLoading: boolean
 *   hasPermission: boolean
 * }
 *
 * interface ButtonProps {
 *   label: ComposableProp<LabelState, string>
 *   className: ComposableProp<StyleState, string>
 *   disabled?: ComposableProp<DisabledState, boolean>
 * }
 *
 * function Button({ label, className, disabled }: ButtonProps) {
 *   const composed = useComposableProps({ label, className, disabled }, {
 *     className: {
 *       fallback: (state, defaultValue) => 'btn',
 *       transform: (value, state, defaultValue) => `${value} ${state.theme}-theme ${state.isPressed ? 'pressed' : ''}`
 *     },
 *     disabled: {
 *       default: false
 *     }
 *   })
 *
 *   const [clickCount, setClickCount] = useState(0)
 *   const [isHovered, setIsHovered] = useState(false)
 *   const [isPressed, setIsPressed] = useState(false)
 *   const [isLoading, setIsLoading] = useState(false)
 *
 *   const labelState = { clickCount, userName: 'John' }
 *   const styleState = { isHovered, isPressed, theme: 'light' as const }
 *   const disabledState = { isLoading, hasPermission: true }
 *
 *   return (
 *     <button
 *       className={composed.className(styleState)}
 *       disabled={composed.disabled(disabledState)}
 *       onMouseEnter={() => setIsHovered(true)}
 *       onMouseLeave={() => setIsHovered(false)}
 *       onMouseDown={() => setIsPressed(true)}
 *       onMouseUp={() => setIsPressed(false)}
 *       onClick={() => setClickCount(c => c + 1)}
 *     >
 *       {composed.label(labelState)}
 *     </button>
 *   )
 * }
 *
 * // Usage with static values
 * <Button label="Click me" className="primary-btn" />
 *
 * // Usage with functions - each prop can use different state shapes
 * <Button
 *   label={({ clickCount, userName }) => `${userName} clicked ${clickCount} times`}
 *   className={({ theme, isPressed }) => `btn-${theme} ${isPressed ? 'pressed' : 'normal'}`}
 *   disabled={({ isLoading, hasPermission }) => isLoading || !hasPermission}
 * />
 * ```
 */
export function useComposableProps<T extends Record<string, any>>(
  props: T,
  options?: OptionsMap<T>,
  deps?: DependencyList,
): ComposedFns<T> {
  return useMemo(
    () => {
      const composed = {} as ComposedFns<T>
      const allKeys = new Set([
        ...Object.keys(props),
        ...(options ? Object.keys(options) : []),
      ])
      for (const key of allKeys) {
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
