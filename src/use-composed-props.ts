import { DependencyList, useMemo } from 'react'
import { compose } from './compose.js'
import { OptionsMap, ResolvedProps, StateMap } from './types.js'

/**
 * Resolves all ComposableProp values immediately using the provided state map.
 *
 * Takes ComposableProp values and their corresponding state objects, then returns
 * an object containing all resolved final values. The resolution process applies
 * any configured options including fallback, transform, and default value logic.
 *
 * @param props - Object containing ComposableProp values to resolve
 * @param state - State map where each key corresponds to a prop and provides the state for resolution
 * @param options - Optional configuration specifying fallback, transform, and default logic per prop
 * @param deps - Optional dependency array for memoization (defaults to [props, state, options])
 * @returns Object containing all props resolved to their final values
 *
 * @example
 * ```tsx
 * import { useComposedProps, ComposableProp } from '@diskette/composed-props'
 *
 * interface CardState {
 *   isExpanded: boolean
 *   variant: 'primary' | 'secondary'
 * }
 *
 * interface ImageState {
 *   isLoaded: boolean
 *   hasError: boolean
 * }
 *
 * interface CardProps {
 *   title: ComposableProp<CardState, string>
 *   className: ComposableProp<CardState, string>
 *   image?: ComposableProp<ImageState, string>
 *   showFooter?: ComposableProp<CardState, boolean>
 * }
 *
 * function Card({ title, className, image, showFooter }: CardProps) {
 *   const [isExpanded, setIsExpanded] = useState(false)
 *   const [isLoaded, setIsLoaded] = useState(false)
 *   const [hasError, setHasError] = useState(false)
 *   const variant = 'primary'
 *
 *   const resolved = useComposedProps(
 *     { title, className, image, showFooter },
 *     {
 *       title: { isExpanded, variant },
 *       className: { isExpanded, variant },
 *       image: { isLoaded, hasError },
 *       showFooter: { isExpanded, variant }
 *     },
 *     {
 *       className: {
 *         fallback: (state) => 'card',
 *         transform: (value, state) => `${value} ${state.variant} ${state.isExpanded ? 'expanded' : 'collapsed'}`
 *       },
 *       showFooter: {
 *         default: true
 *       }
 *     }
 *   )
 *
 *   return (
 *     <div className={resolved.className} onClick={() => setIsExpanded(!isExpanded)}>
 *       <h2>{resolved.title}</h2>
 *       {resolved.image && (
 *         <img
 *           src={resolved.image}
 *           onLoad={() => setIsLoaded(true)}
 *           onError={() => setHasError(true)}
 *         />
 *       )}
 *       {resolved.showFooter && <footer>Card footer content</footer>}
 *     </div>
 *   )
 * }
 *
 * // Usage with static values
 * <Card title="My Card" className="card-primary" />
 *
 * // Usage with functions
 * <Card
 *   title={({ isExpanded }) => isExpanded ? "Expanded Card ⬆️" : "Collapsed Card ⬇️"}
 *   className={({ variant, isExpanded }) => `card-${variant} ${isExpanded ? 'expanded' : ''}`}
 *   image={({ isLoaded, hasError }) => hasError ? '/error.png' : isLoaded ? '/success.png' : '/loading.png'}
 *   showFooter={({ isExpanded }) => isExpanded}
 * />
 * ```
 */
export function useComposedProps<T extends Record<string, any>>(
  props: T,
  state: StateMap<T>,
  options?: OptionsMap<T>,
  deps?: DependencyList,
): ResolvedProps<T> {
  return useMemo(
    () => {
      const resolved = {} as ResolvedProps<T>

      // Get all keys from both props and options
      const allKeys = new Set([
        ...Object.keys(props),
        ...(options ? Object.keys(options) : [])
      ])

      for (const key of allKeys) {
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
