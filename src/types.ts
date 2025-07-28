import { ComponentPropsWithRef, ElementType } from 'react'

export type ComposableProp<T, V> = V | ((props: T, defaultValue?: V) => V)

export type ComposeOptions<T, U, V extends T> = {
  fallback?: (props: U, defaultValue?: V) => V
  transform?: (value: V, props: U, defaultValue?: V) => V
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
