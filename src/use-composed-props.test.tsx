import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useComposedProps } from './use-composed-props.js'
import type { ComposableProp } from './types.js'

describe('useComposedProps', () => {
	it('returns static values unchanged', () => {
		interface Props {
			color: ComposableProp<{}, string>
			size: ComposableProp<{}, number>
			enabled: ComposableProp<{}, boolean>
		}

		const props: Props = {
			color: 'red',
			size: 10,
			enabled: true,
		}

		const state = {
			color: {},
			size: {},
			enabled: {},
		}

		const { result } = renderHook(() => useComposedProps(props, state))

		expect(result.current).toEqual({
			color: 'red',
			size: 10,
			enabled: true,
		})
	})

	it('resolves function values with state', () => {
		interface ThemeState {
			theme: string
		}

		interface ScaleState {
			scale: number
		}

		interface Props {
			color: ComposableProp<ThemeState, string>
			size: ComposableProp<ScaleState, number>
		}

		const props: Props = {
			color: (state) => state.theme === 'dark' ? 'white' : 'black',
			size: (state) => state.scale * 10,
		}

		const state = {
			color: { theme: 'dark' },
			size: { scale: 2 },
		}

		const { result } = renderHook(() => useComposedProps(props, state))

		expect(result.current).toEqual({
			color: 'white',
			size: 20,
		})
	})

	it('handles mixed static and function props', () => {
		interface ScaleState {
			scale: number
		}

		interface Props {
			color: ComposableProp<{}, string>
			size: ComposableProp<ScaleState, number>
			enabled: ComposableProp<{}, boolean>
		}

		const props: Props = {
			color: 'red',
			size: (state) => state.scale * 10,
			enabled: true,
		}

		const state = {
			color: {},
			size: { scale: 3 },
			enabled: {},
		}

		const { result } = renderHook(() => useComposedProps(props, state))

		expect(result.current).toEqual({
			color: 'red',
			size: 30,
			enabled: true,
		})
	})

	it('applies fallback when value is undefined', () => {
		interface ScaleState {
			scale?: number
		}

		interface Props {
			color: ComposableProp<{}, string | undefined>
			size: ComposableProp<ScaleState, number | undefined>
		}

		const props: Props = {
			color: undefined,
			size: (state) => state.scale,
		}

		const state = {
			color: {},
			size: {},
		}

		const options = {
			color: { fallback: () => 'default' },
			size: { fallback: () => 100 },
		}

		const { result } = renderHook(() => useComposedProps(props, state, options))

		expect(result.current).toEqual({
			color: 'default',
			size: 100,
		})
	})

	it('applies transform function', () => {
		interface Props {
			color: ComposableProp<{}, string>
			size: ComposableProp<{}, number>
		}

		const props: Props = {
			color: 'red',
			size: 10,
		}

		const state = {
			color: {},
			size: {},
		}

		const options = {
			color: { transform: (val: string) => val.toUpperCase() },
			size: { transform: (val: number) => val * 2 },
		}

		const { result } = renderHook(() => useComposedProps(props, state, options))

		expect(result.current).toEqual({
			color: 'RED',
			size: 20,
		})
	})

	it('applies both fallback and transform', () => {
		interface ScaleState {
			scale?: number
		}

		interface Props {
			color: ComposableProp<{}, string | undefined>
			size: ComposableProp<ScaleState, number | undefined>
		}

		const props: Props = {
			color: undefined,
			size: (state) => state.scale,
		}

		const state = {
			color: {},
			size: { scale: 5 },
		}

		const options = {
			color: {
				fallback: () => 'blue',
				transform: (val: string | undefined) => val?.toUpperCase() ?? '',
			},
			size: {
				transform: (val: number | undefined) => (val ?? 0) * 2,
			},
		}

		const { result } = renderHook(() => useComposedProps(props, state, options))

		expect(result.current).toEqual({
			color: 'BLUE',
			size: 10,
		})
	})

	it('memoizes result based on dependencies', () => {
		interface Props {
			color: ComposableProp<{}, string>
		}

		const props: Props = { color: 'red' }
		const state = {
			color: {},
		}

		const { result, rerender } = renderHook(
			({ props, state, options }) => useComposedProps(props, state, options),
			{ initialProps: { props, state, options: undefined } }
		)

		const firstResult = result.current

		rerender({ props, state, options: undefined })
		expect(result.current).toBe(firstResult)

		rerender({ props: { color: 'blue' }, state, options: undefined })
		expect(result.current).not.toBe(firstResult)
		expect(result.current).toEqual({ color: 'blue' })
	})

	it('uses custom dependencies when provided', () => {
		interface Props {
			color: ComposableProp<{}, string>
		}

		const props: Props = { color: 'red' }
		const state = {
			color: {},
		}
		const customDep = { value: 1 }

		const { result, rerender } = renderHook(
			({ props, state, dep }) => useComposedProps(props, state, undefined, [dep]),
			{ initialProps: { props, state, dep: customDep } }
		)

		const firstResult = result.current

		rerender({ props: { color: 'blue' }, state, dep: customDep })
		expect(result.current).toBe(firstResult)

		rerender({ props: { color: 'blue' }, state, dep: { value: 2 } })
		expect(result.current).not.toBe(firstResult)
	})


	it('handles different state per prop', () => {
		interface ThemeState {
			theme: string
		}

		interface ScaleState {
			scale: number
		}

		interface ActiveState {
			active: boolean
		}

		interface Props {
			color: ComposableProp<ThemeState, string>
			size: ComposableProp<ScaleState, number>
			enabled: ComposableProp<ActiveState, boolean>
		}

		const props: Props = {
			color: (state) => state.theme === 'dark' ? 'white' : 'black',
			size: (state) => state.scale * 10,
			enabled: (state) => state.active,
		}

		const state = {
			color: { theme: 'dark' },
			size: { scale: 1.5 },
			enabled: { active: true },
		}

		const { result } = renderHook(() => useComposedProps(props, state))

		expect(result.current).toEqual({
			color: 'white',
			size: 15,
			enabled: true,
		})
	})

})