import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { createUseComposableProps } from './create-use-composable-props.js'
import type { ComposableProp } from './types.js'

describe('createUseComposableProps', () => {
  it('makes whitelisted props composable, passes through others', () => {
    const useComposable = createUseComposableProps(['children', 'className'])

    function TestComponent(props: {
      children: ComposableProp<{ name: string }, string>
      className: ComposableProp<{ theme: string }, string>
      onClick: () => void
      disabled: boolean
    }) {
      const composed = useComposable(props)
      return (
        <button
          className={composed.className({ theme: 'dark' })}
          onClick={composed.onClick}
          disabled={composed.disabled}
          data-testid="button"
        >
          {composed.children({ name: 'Test' })}
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

    const button = screen.getByTestId('button') as HTMLButtonElement
    expect(button.textContent).toBe('Hello Test')
    expect(button.className).toBe('btn-dark')
    expect(button.disabled).toBe(true)
  })

  it('handles static values for whitelisted props', () => {
    const useComposable = createUseComposableProps(['children', 'style'])

    function TestComponent(props: {
      children: ComposableProp<{}, string>
      style: ComposableProp<{}, React.CSSProperties>
      id: string
    }) {
      const composed = useComposable(props)
      return (
        <div style={composed.style({})} id={composed.id} data-testid="div">
          {composed.children({})}
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

    const div = screen.getByTestId('div') as HTMLDivElement
    expect(div.textContent).toBe('Static content')
    expect(div.style.color).toBe('red')
    expect(div.id).toBe('test-id')
  })

  it('applies options to whitelisted props only', () => {
    const useComposable = createUseComposableProps(['label'])

    function TestComponent(props: {
      label?: ComposableProp<{ name: string }, string>
      className?: string
      id: string
    }) {
      const composed = useComposable(props, {
        label: {
          fallback: ({ name }) => `Fallback for ${name}`,
          transform: (value) => (value ?? '').toUpperCase(),
        },
      })

      return (
        <div className={composed.className} id={composed.id} data-testid="div">
          {composed.label?.({ name: 'John' }) ?? ''}
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
    const useComposable = createUseComposableProps([])

    function TestComponent(props: {
      children: string
      className: string
    }) {
      const composed = useComposable(props)
      return (
        <div className={composed.className} data-testid="div">
          {composed.children}
        </div>
      )
    }

    render(
      <TestComponent children="Test content" className="test-class" />
    )

    const div = screen.getByTestId('div')
    expect(div.textContent).toBe('Test content')
    expect(div.className).toBe('test-class')
  })
})
