import { ComponentPropsWithRef, ElementType } from 'react'

export type ComposableProp<T, V> = V | ((props: T) => V)

export type ComposeOptions<T, U, V extends T> = {
	fallback?: (renderProps: U) => V
	render?: (prevValue: T, renderProps: U) => V
	transform?: (prevValue: V, renderProps: U) => V
}

export type ComposeComponentProps<
	TProps extends Record<string, any>,
	TElement extends ElementType = 'div',
> = Omit<ComponentPropsWithRef<TElement>, keyof TProps> & TProps

export type ComposedFns<T, K extends readonly (keyof T)[]> = {
	[P in K[number]]: T[P] extends ComposableProp<infer S, infer R>
		? (state: S) => R
		: never
}

export type OptionsMap<T, K extends readonly (keyof T)[]> = {
	[P in K[number]]?: T[P] extends ComposableProp<infer S, infer R>
		? ComposeOptions<R, S, R>
		: never
}
