import { describe, it, expect, vi } from 'vitest'
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
		const prop = (state: { theme: string }) => state.theme === 'dark' ? 'white' : 'black'
		
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

		const result = compose(undefined as string | undefined, options)({ theme: 'dark' })
		expect(result).toBe('fallback value')
		expect(fallbackFn).toHaveBeenCalledWith({ theme: 'dark' })
	})

	it('calls transform with state', () => {
		const transformFn = vi.fn((val: string, state: { theme: string }) => 
			`${val}-${state.theme}`
		)
		const options = { transform: transformFn }

		const result = compose('color', options)({ theme: 'dark' })
		expect(result).toBe('color-dark')
		expect(transformFn).toHaveBeenCalledWith('color', { theme: 'dark' })
	})

	it('propagates errors from function props', () => {
		const errorProp = () => {
			throw new Error('Test error')
		}

		expect(() => compose(errorProp)({})).toThrow('Test error')
	})

	it('propagates errors from transform function', () => {
		const options = {
			transform: () => {
				throw new Error('Transform error')
			},
		}

		expect(() => compose('value', options)({})).toThrow('Transform error')
	})

	it('handles empty options', () => {
		const result = compose('value', {})({})
		expect(result).toBe('value')
	})

	it('handles undefined options', () => {
		const result = compose('value', undefined)({})
		expect(result).toBe('value')
	})
})