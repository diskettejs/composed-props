import { ComponentPropsWithRef, ElementType } from 'react'

/**
 * Represents a prop value that may be static or computed dynamically from component state.
 *
 * `ComposableProp` allows component props to accept either a direct value or a function that
 * computes the value based on the current component state. The function receives the state
 * as its first argument and an optional default value as its second argument.
 *
 * @example
 * ```tsx
 * interface ThemeState {
 *   isDark: boolean
 *   primaryColor: string
 * }
 *
 * interface ButtonProps {
 *   backgroundColor: ComposableProp<ThemeState, string>
 *   fontSize: ComposableProp<ThemeState, number>
 * }
 *
 * // Static values
 * <Button backgroundColor="blue" fontSize={14} />
 *
 * // Dynamic values based on state
 * <Button
 *   backgroundColor={({ isDark, primaryColor }) => isDark ? '#333' : primaryColor}
 *   fontSize={({ isDark }) => isDark ? 16 : 14}
 * />
 * ```
 */
export type ComposableProp<T, V> = V | ((props: T, defaultValue?: V) => V)

/**
 * Configuration object for controlling {@link ComposableProp} resolution behavior.
 *
 * {@link ComposeOptions} defines optional processing steps that occur during prop resolution.
 *
 * @example
 * ```tsx
 * interface AppState {
 *   theme: 'light' | 'dark'
 *   userPreferences: { highContrast: boolean }
 * }
 *
 * const colorOptions: ComposeOptions<string, AppState, string> = {
 *   fallback: (state) => state.theme === 'dark' ? '#ffffff' : '#000000',
 *   transform: (color, state) => state.userPreferences.highContrast
 *     ? adjustContrast(color)
 *     : color,
 *   default: '#808080'
 * }
 *
 * // Resolution order:
 * // 1. Resolve prop value (static value or function result)
 * // 2. If `undefined`, apply fallback function
 * // 3. If still `undefined`, use default value
 * // 4. Apply transform function to final result
 * ```
 */
export type ComposeOptions<T, U, V extends T> = {
  /** Called when the resolved `prop` value is `undefined`. Receives the state and `default` value. */
  fallback?: (props: U, defaultValue?: V) => V
  /** Function to transform the final resolved value. Called with the `value`, `state`, and `default` value. */
  transform?: (value: V, props: U, defaultValue?: V) => V
  /** Default `value` to use when `prop` is `undefined` and no `fallback` is provided. */
  default?: V
}

export type ComposeComponentProps<
  TProps extends Record<string, any>,
  TElement extends ElementType = 'div',
> = Omit<ComponentPropsWithRef<TElement>, keyof TProps> & TProps

export type ComposedFns<T> = {
  [P in keyof T]: T[P] extends ComposableProp<infer S, infer R>
    ? (state: S) => R
    : (state: any) => T[P]
}

export type OptionsMap<T> = {
  [P in keyof T]?: T[P] extends ComposableProp<infer S, infer R>
    ? ComposeOptions<R, S, R>
    : ComposeOptions<T[P], any, T[P]>
}

export type ResolvedProps<T> = {
  [P in keyof T]: T[P] extends ComposableProp<any, infer R> ? R : T[P]
}

export type StateMap<T> = {
  [P in keyof T]: T[P] extends ComposableProp<infer S, infer _R> ? S : any
}
