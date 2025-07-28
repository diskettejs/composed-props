import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ComposableProp } from './types.js'
import { useComposableProps } from './use-composable-props.js'

describe('useComposableProps', () => {
  it('returns functions for static values', () => {
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

    const { result } = renderHook(() => useComposableProps(props))

    expect(result.current.color({})).toBe('red')
    expect(result.current.size({})).toBe(10)
    expect(result.current.enabled({})).toBe(true)
  })

  it('returns wrapped functions for function values', () => {
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
      color: (state) => (state.theme === 'dark' ? 'white' : 'black'),
      size: (state) => state.scale * 10,
    }

    const { result } = renderHook(() => useComposableProps(props))

    expect(result.current.color({ theme: 'dark' })).toBe('white')
    expect(result.current.color({ theme: 'light' })).toBe('black')
    expect(result.current.size({ scale: 2 })).toBe(20)
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

    const { result } = renderHook(() => useComposableProps(props))

    expect(result.current.color({})).toBe('red')
    expect(result.current.size({ scale: 3 })).toBe(30)
    expect(result.current.enabled({})).toBe(true)
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

    const options = {
      color: { fallback: () => 'default' },
      size: { fallback: () => 100 },
    }

    const { result } = renderHook(() => useComposableProps(props, options))

    expect(result.current.color({})).toBe('default')
    expect(result.current.size({})).toBe(100)
    expect(result.current.size({ scale: 50 })).toBe(50)
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

    const options = {
      color: { transform: (val: string) => val.toUpperCase() },
      size: { transform: (val: number) => val * 2 },
    }

    const { result } = renderHook(() => useComposableProps(props, options))

    expect(result.current.color({})).toBe('RED')
    expect(result.current.size({})).toBe(20)
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

    const options = {
      color: {
        fallback: () => 'blue',
        transform: (val: string | undefined) => val?.toUpperCase() ?? '',
      },
      size: {
        fallback: () => 10,
        transform: (val: number | undefined) => (val ?? 0) * 2,
      },
    }

    const { result } = renderHook(() => useComposableProps(props, options))

    expect(result.current.color({})).toBe('BLUE')
    expect(result.current.size({})).toBe(20)
    expect(result.current.size({ scale: 5 })).toBe(10)
  })

  it('memoizes result based on dependencies', () => {
    interface Props {
      color: ComposableProp<{}, string>
    }

    const props: Props = { color: 'red' }

    const { result, rerender } = renderHook(
      ({ props, options }) => useComposableProps(props, options),
      { initialProps: { props, options: undefined } },
    )

    const firstResult = result.current

    rerender({ props, options: undefined })
    expect(result.current).toBe(firstResult)

    rerender({ props: { color: 'blue' }, options: undefined })
    expect(result.current).not.toBe(firstResult)
  })

  it('uses custom dependencies when provided', () => {
    interface Props {
      color: ComposableProp<{}, string>
    }

    const props: Props = { color: 'red' }
    const customDep = { value: 1 }

    const { result, rerender } = renderHook(
      ({ props, dep }) => useComposableProps(props, undefined, [dep]),
      { initialProps: { props, dep: customDep } },
    )

    const firstResult = result.current

    rerender({ props: { color: 'blue' }, dep: customDep })
    expect(result.current).toBe(firstResult)

    rerender({ props: { color: 'blue' }, dep: { value: 2 } })
    expect(result.current).not.toBe(firstResult)
  })
})
