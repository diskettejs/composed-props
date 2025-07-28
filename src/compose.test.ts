import { describe, expect, it, vi } from 'vitest'
import { compose } from './compose.js'

describe('compose', () => {
  it('returns static value when prop is not a function', () => {
    const result = compose('red')({})
    expect(result).toBe('red')

    const result2 = compose(42)({ scale: 2 })
    expect(result2).toBe(42)

    const result3 = compose(true)({})
    expect(result3).toBe(true)
  })

  it('calls function prop with state', () => {
    const prop = (state: { theme: string }) =>
      state.theme === 'dark' ? 'white' : 'black'

    const result1 = compose(prop)({ theme: 'dark' })
    expect(result1).toBe('white')

    const result2 = compose(prop)({ theme: 'light' })
    expect(result2).toBe('black')
  })

  it('applies fallback when value is undefined', () => {
    const options = { fallback: () => 'default' }

    const result1 = compose(undefined as string | undefined, options)({})
    expect(result1).toBe('default')

    const prop = () => undefined
    const result2 = compose(prop, options)({})
    expect(result2).toBe('default')
  })

  it('applies transform function', () => {
    const options = { transform: (val: string) => val.toUpperCase() }

    const result1 = compose('hello', options)({})
    expect(result1).toBe('HELLO')

    const prop = (state: { text: string }) => state.text
    const result2 = compose(prop, options)({ text: 'world' })
    expect(result2).toBe('WORLD')
  })

  it('applies both fallback and transform', () => {
    const options = {
      fallback: () => 'default',
      transform: (val: string) => val.toUpperCase(),
    }

    const result1 = compose(undefined as string | undefined, options)({})
    expect(result1).toBe('DEFAULT')

    const result2 = compose('hello', options)({})
    expect(result2).toBe('HELLO')
  })

  it('handles null values', () => {
    const result = compose(null)({})
    expect(result).toBe(null)

    const options = { fallback: () => 'default' }
    const result2 = compose(null, options)({})
    expect(result2).toBe(null)
  })

  it('handles complex objects', () => {
    const style = { color: 'red', fontSize: 16 }
    const result = compose(style)({})
    expect(result).toEqual({ color: 'red', fontSize: 16 })
  })

  it('calls fallback function when value is undefined', () => {
    const fallbackFn = vi.fn(() => 'fallback value')
    const options = { fallback: fallbackFn }

    const result = compose(
      undefined as string | undefined,
      options,
    )({ theme: 'dark' })
    expect(result).toBe('fallback value')
    expect(fallbackFn).toHaveBeenCalledWith({ theme: 'dark' }, undefined)
  })

  it('calls transform with state', () => {
    const transformFn = vi.fn(
      (val: string, state: { theme: string }) => `${val}-${state.theme}`,
    )
    const options = { transform: transformFn }

    const result = compose('color', options)({ theme: 'dark' })
    expect(result).toBe('color-dark')
    expect(transformFn).toHaveBeenCalledWith(
      'color',
      { theme: 'dark' },
      undefined,
    )
  })

  describe('default option', () => {
    it('passes default value to function as second argument', () => {
      const fn = vi.fn((state: { count: number }, defaultValue?: number) =>
        state.count > 0 ? state.count : (defaultValue ?? 0),
      )
      const options = { default: 10 }

      const result1 = compose(fn, options)({ count: 5 })
      expect(result1).toBe(5)
      expect(fn).toHaveBeenCalledWith({ count: 5 }, 10)

      const result2 = compose(fn, options)({ count: 0 })
      expect(result2).toBe(10)
      expect(fn).toHaveBeenCalledWith({ count: 0 }, 10)
    })

    it('uses default value when result is undefined and no fallback', () => {
      const fn = () => undefined
      const options = { default: 'default-value' }

      const result = compose(fn, options)({})
      expect(result).toBe('default-value')
    })

    it('fallback takes precedence over default when both are specified', () => {
      const fn = () => undefined
      const options = {
        fallback: () => 'fallback-value',
        default: 'default-value',
      }

      const result = compose(fn, options)({})
      expect(result).toBe('fallback-value')
    })

    it('passes default value to fallback function', () => {
      const fallbackFn = vi.fn((_state: any, defaultValue?: string) =>
        defaultValue ? `${defaultValue}-fallback` : 'fallback',
      )
      const options = {
        fallback: fallbackFn,
        default: 'base',
      }

      const result = compose(
        undefined as string | undefined,
        options,
      )({ theme: 'dark' })
      expect(result).toBe('base-fallback')
      expect(fallbackFn).toHaveBeenCalledWith({ theme: 'dark' }, 'base')
    })

    it('passes default value to transform function', () => {
      const transformFn = vi.fn(
        (val: string, _state: any, defaultValue?: string) =>
          defaultValue ? `${val}-${defaultValue}` : val,
      )
      const options = {
        transform: transformFn,
        default: 'base',
      }

      const result = compose('value', options)({ theme: 'dark' })
      expect(result).toBe('value-base')
      expect(transformFn).toHaveBeenCalledWith(
        'value',
        { theme: 'dark' },
        'base',
      )
    })

    it('uses default when fallback returns undefined', () => {
      const options = {
        fallback: () => undefined,
        default: 'default-value',
      }

      const result = compose(undefined as string | undefined, options)({})
      expect(result).toBe('default-value')
    })

    it('transforms default value when used as final result', () => {
      const options = {
        default: 'default',
        transform: (val: string) => val.toUpperCase(),
      }

      const result = compose(undefined as string | undefined, options)({})
      expect(result).toBe('DEFAULT')
    })

    it('works with complex default values', () => {
      const defaultStyle = { color: 'blue', fontSize: 14 }
      const fn = (state: { override?: boolean }) =>
        state.override ? { color: 'red', fontSize: 16 } : undefined

      const options = { default: defaultStyle }

      const result1 = compose(fn, options)({ override: false })
      expect(result1).toEqual({ color: 'blue', fontSize: 14 })

      const result2 = compose(fn, options)({ override: true })
      expect(result2).toEqual({ color: 'red', fontSize: 16 })
    })

    it('handles null vs undefined correctly', () => {
      const options = { default: 'default-value' }

      // null is a valid value, should not use default
      const result1 = compose(null, options)({})
      expect(result1).toBe(null)

      // undefined should use default
      const result2 = compose(undefined as string | undefined, options)({})
      expect(result2).toBe('default-value')
    })
  })
})
