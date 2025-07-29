import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { createUseComposedProps } from './create-use-composed-props.js'
import type { ComposableProp } from './types.js'

describe('createUseComposedProps', () => {
  it('resolves whitelisted props and passes through others', () => {
    const useComposed = createUseComposedProps(['children', 'className'])

    function TestComponent(props: {
      children: ComposableProp<{ name: string }, string>
      className: ComposableProp<{ theme: string }, string>
      onClick: () => void
      disabled: boolean
    }) {
      const resolved = useComposed(
        props,
        {
          children: { name: 'Test' },
          className: { theme: 'dark' },
        }
      )
      return (
        <button
          className={resolved.className}
          onClick={resolved.onClick}
          disabled={resolved.disabled}
          data-testid="button"
        >
          {resolved.children}
        </button>
      )
    }

    render(
      <TestComponent
        children={({ name }) => `Hello ${name}`}
        className={({ theme }) => `btn-${theme}`}
        onClick={() => {}}
        disabled={true}
      />
    )

    const button = screen.getByTestId('button')
    expect(button.textContent).toBe('Hello Test')
    expect(button.className).toBe('btn-dark')
    expect(button).toHaveProperty('disabled', true)
  })

  it('handles static values for whitelisted props', () => {
    const useComposed = createUseComposedProps(['children', 'style'])

    function TestComponent(props: {
      children: ComposableProp<{}, string>
      style: ComposableProp<{}, React.CSSProperties>
      id: string
    }) {
      const resolved = useComposed(
        props,
        {
          children: {},
          style: {},
        }
      )
      return (
        <div style={resolved.style} id={resolved.id} data-testid="div">
          {resolved.children}
        </div>
      )
    }

    render(
      <TestComponent
        children="Static content"
        style={{ color: 'red' }}
        id="test-id"
      />
    )

    const div = screen.getByTestId('div')
    expect(div.textContent).toBe('Static content')
    expect(div.style.color).toBe('red')
    expect(div.id).toBe('test-id')
  })

  it('applies options to whitelisted props only', () => {
    const useComposed = createUseComposedProps(['label'])

    function TestComponent(props: {
      label?: ComposableProp<{ name: string }, string>
      className?: string
      id: string
    }) {
      const resolved = useComposed(
        props,
        {
          label: { name: 'John' },
        },
        {
          label: {
            fallback: ({ name }) => `Fallback for ${name}`,
            transform: (value) => (value ?? '').toUpperCase(),
          },
        }
      )

      return (
        <div className={resolved.className} id={resolved.id} data-testid="div">
          {resolved.label}
        </div>
      )
    }

    render(<TestComponent id="test-id" className="test-class" label={undefined} />)

    const div = screen.getByTestId('div')
    expect(div.textContent).toBe('FALLBACK FOR JOHN')
    expect(div.className).toBe('test-class')
    expect(div.id).toBe('test-id')
  })

  it('passes through all props when whitelist is empty', () => {
    const useComposed = createUseComposedProps([])

    function TestComponent(props: {
      children: string
      className: string
    }) {
      const resolved = useComposed(props, {})
      return (
        <div className={resolved.className} data-testid="div">
          {resolved.children}
        </div>
      )
    }

    render(
      <TestComponent className="test-class">Test content</TestComponent>
    )

    const div = screen.getByTestId('div')
    expect(div.textContent).toBe('Test content')
    expect(div.className).toBe('test-class')
  })
})