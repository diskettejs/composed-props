import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ComposableProp } from './types.js'
import { useComposableProps } from './use-composable-props.js'

interface TestState {
	isActive: boolean
	count: number
}

interface BasicProps {
	title: ComposableProp<TestState, string>
	className?: ComposableProp<TestState, string>
	isVisible?: ComposableProp<TestState, boolean>
}

interface OptionsProps {
	title?: ComposableProp<TestState, string>
	className?: ComposableProp<TestState, string>
	count?: ComposableProp<TestState, number>
}

describe('useComposableProps', () => {
	it('resolves static and function props correctly', () => {
		const props: BasicProps = {
			title: 'Static Title',
			className: ({ isActive }) => (isActive ? 'active' : 'inactive'),
			isVisible: true,
		}

		const { result } = renderHook(() => useComposableProps(props))

		const state: TestState = { isActive: false, count: 1 }

		expect(result.current.title(state)).toBe('Static Title')
		expect(result.current.className?.(state)).toBe('inactive')
		expect(result.current.isVisible?.(state)).toBe(true)

		const activeState: TestState = { isActive: true, count: 1 }
		expect(result.current.className?.(activeState)).toBe('active')
	})

	it('updates resolved values when state changes', () => {
		const props: BasicProps = {
			title: ({ isActive, count }) =>
				`${isActive ? 'Active' : 'Inactive'} - ${count}`,
			className: ({ isActive }) => `state-${isActive ? 'on' : 'off'}`,
			isVisible: ({ count }) => count > 2,
		}

		const { result } = renderHook(() => useComposableProps(props))

		const inactiveState: TestState = { isActive: false, count: 1 }
		expect(result.current.title(inactiveState)).toBe('Inactive - 1')
		expect(result.current.className?.(inactiveState)).toBe('state-off')
		expect(result.current.isVisible?.(inactiveState)).toBe(false)

		const activeState: TestState = { isActive: true, count: 1 }
		expect(result.current.title(activeState)).toBe('Active - 1')
		expect(result.current.className?.(activeState)).toBe('state-on')

		const visibleState: TestState = { isActive: true, count: 3 }
		expect(result.current.title(visibleState)).toBe('Active - 3')
		expect(result.current.isVisible?.(visibleState)).toBe(true)
	})

	it('applies fallback, default, and transform options', () => {
		const props: OptionsProps = {
			className: 'base',
			count: 5,
		}

		const options = {
			title: {
				fallback: () => 'Default Title',
			},
			className: {
				fallback: () => 'default-class',
				transform: (value: string | undefined, state: TestState) =>
					`${value || ''} ${state.isActive ? 'active' : 'inactive'}`,
			},
			count: {
				default: 10,
				transform: (value = 0) => value * 2,
			},
		}

		const { result } = renderHook(() => useComposableProps(props, options))

		const state: TestState = { isActive: false, count: 5 }
		expect(result.current.title?.(state)).toBe('Default Title')
		expect(result.current.className?.(state)).toBe('base inactive')
		expect(result.current.count?.(state)).toBe(10)

		const activeState: TestState = { isActive: true, count: 5 }
		expect(result.current.className?.(activeState)).toBe('base active')
	})

	it('applies fallback when prop is undefined', () => {
		const props: OptionsProps = {}

		const options = {
			title: {
				fallback: () => 'Default Title',
			},
			className: {
				fallback: () => 'default-class',
			},
		}

		const { result } = renderHook(() => useComposableProps(props, options))

		const state: TestState = { isActive: false, count: 5 }
		expect(result.current.title?.(state)).toBe('Default Title')
		expect(result.current.className?.(state)).toBe('default-class')
	})

	it('applies default value when prop is undefined', () => {
		const props: OptionsProps = {}

		const options = {
			count: {
				default: 10,
				transform: (value = 0) => value * 2,
			},
		}

		const { result } = renderHook(() => useComposableProps(props, options))

		const state: TestState = { isActive: false, count: 5 }
		expect(result.current.count?.(state)).toBe(20)
	})

	it('evaluates function props with correct state and tracks calls', () => {
		const titleFn = vi.fn(({ isActive, count }: TestState) =>
			isActive ? `Active ${count}` : `Inactive ${count}`
		)

		const props: BasicProps = {
			title: titleFn,
			className: 'test',
		}

		const { result } = renderHook(() => useComposableProps(props))

		const inactiveState: TestState = { isActive: false, count: 1 }
		expect(result.current.title(inactiveState)).toBe('Inactive 1')
		expect(titleFn).toHaveBeenCalledTimes(1)
		expect(titleFn).toHaveBeenCalledWith({ isActive: false, count: 1 }, undefined)

		const activeState: TestState = { isActive: true, count: 1 }
		expect(result.current.title(activeState)).toBe('Active 1')
		expect(titleFn).toHaveBeenCalledTimes(2)
		expect(titleFn).toHaveBeenLastCalledWith({ isActive: true, count: 1 }, undefined)
	})

	it('re-evaluates when props change', () => {
		let props: BasicProps = {
			title: 'Title 1',
			className: 'class1',
		}

		const { result, rerender } = renderHook(() => useComposableProps(props))

		const state: TestState = { isActive: false, count: 1 }
		expect(result.current.title(state)).toBe('Title 1')
		expect(result.current.className?.(state)).toBe('class1')

		props = {
			title: 'Title 2',
			className: 'class2',
		}

		rerender()
		expect(result.current.title(state)).toBe('Title 2')
		expect(result.current.className?.(state)).toBe('class2')
	})
})
