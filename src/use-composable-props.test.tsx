import React from 'react'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { ComposableProp } from './types.js'
import { useComposableProps } from './use-composable-props.js'

interface ButtonState {
  clickCount: number
  isPressed: boolean
  theme: 'light' | 'dark'
}

interface LabelState {
  userName: string
  isActive: boolean
}

interface ButtonProps {
  label: ComposableProp<LabelState, string>
  className?: ComposableProp<ButtonState, string>
  disabled?: ComposableProp<ButtonState, boolean>
  onClick?: () => void
}

function TestComponent({ label, className, disabled, onClick }: ButtonProps) {
  const [clickCount, setClickCount] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [theme] = useState<'light' | 'dark'>('light')

  const composed = useComposableProps({ label, className, disabled })

  const buttonState: ButtonState = { clickCount, isPressed, theme }
  const labelState: LabelState = { userName: 'TestUser', isActive: true }

  return (
    <button
      className={composed.className(buttonState)}
      disabled={composed.disabled(buttonState)}
      onClick={() => {
        setClickCount((c) => c + 1)
        onClick?.()
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      data-testid="test-button"
    >
      {composed.label(labelState)}
    </button>
  )
}

describe('useComposableProps', () => {
  describe('basic functionality', () => {
    it('should handle static props', () => {
      render(
        <TestComponent
          label="Static Label"
          className="static-class"
          disabled={true}
        />,
      )

      const button = screen.getByTestId('test-button') as HTMLButtonElement
      expect(button.textContent).toBe('Static Label')
      expect(button.className).toBe('static-class')
      expect(button.disabled).toBe(true)
    })

    it('should handle function props', () => {
      render(
        <TestComponent
          label={({ userName, isActive }) =>
            `${userName} is ${isActive ? 'active' : 'inactive'}`
          }
          className={({ theme, clickCount }) =>
            `btn-${theme} clicks-${clickCount}`
          }
          disabled={({ isPressed }) => isPressed}
        />,
      )

      const button = screen.getByTestId('test-button') as HTMLButtonElement
      expect(button.textContent).toBe('TestUser is active')
      expect(button.className).toContain('btn-light')
      expect(button.className).toContain('clicks-0')
      expect(button.disabled).toBe(false)
    })

    it('should handle mixed static and function props', () => {
      render(
        <TestComponent
          label="Mixed Label"
          className={({ theme }) => `dynamic-${theme}`}
          disabled={false}
        />,
      )

      const button = screen.getByTestId('test-button') as HTMLButtonElement
      expect(button.textContent).toBe('Mixed Label')
      expect(button.className).toBe('dynamic-light')
      expect(button.disabled).toBe(false)
    })
  })

  describe('options handling', () => {
    interface StatusCardProps {
      title?: ComposableProp<{ userName: string; isActive: boolean }, string>
      className?: ComposableProp<{ clickCount: number; theme: string }, string>
      disabled?: ComposableProp<{ clickCount: number }, boolean>
    }

    function StatusCard({ title, className, disabled }: StatusCardProps) {
      const composed = useComposableProps(
        { title, className, disabled },
        {
          title: {
            fallback: ({ userName }) => `Fallback for ${userName}`,
            transform: (value, { isActive }) =>
              isActive ? (value ?? '').toUpperCase() : (value ?? ''),
          },
          className: {
            transform: (value, { clickCount }) =>
              `${value} count-${clickCount}`,
          },
          disabled: {
            default: false,
          },
        },
      )

      const titleState = { userName: 'John', isActive: true }
      const styleState = { clickCount: 5, theme: 'light' }
      const disabledState = { clickCount: 5 }

      return (
        <div>
          <div data-testid="title-result">{composed.title(titleState)}</div>
          <div data-testid="class-result">
            {composed.className(styleState)}
          </div>
          <div data-testid="disabled-result">
            {String(composed.disabled(disabledState))}
          </div>
        </div>
      )
    }

    it('should use default values when prop is undefined', () => {
      interface ButtonProps {
        label?: ComposableProp<{ isActive: boolean }, string>
      }

      function Button({ label }: ButtonProps) {
        const composed = useComposableProps(
          { label },
          { label: { default: 'Default Button' } },
        )
        return (
          <button data-testid="button">
            {composed.label({ isActive: false })}
          </button>
        )
      }

      render(<Button />)
      expect(screen.getByTestId('button').textContent).toBe('Default Button')
    })

    it('should apply transform functions', () => {
      render(
        <StatusCard
          className={({ theme }) => `base-${theme}`}
        />,
      )
      expect(screen.getByTestId('title-result').textContent).toBe(
        'FALLBACK FOR JOHN',
      )
      expect(screen.getByTestId('class-result').textContent).toBe(
        'base-light count-5',
      )
    })

    it('should use fallback when default is not provided', () => {
      interface GreetingProps {
        message?: ComposableProp<{ name: string }, string>
      }

      function Greeting({ message }: GreetingProps) {
        const composed = useComposableProps(
          { message },
          { message: { fallback: ({ name }) => `Hello ${name}!` } },
        )
        return (
          <div data-testid="greeting">
            {composed.message({ name: 'World' })}
          </div>
        )
      }

      render(<Greeting />)
      expect(screen.getByTestId('greeting').textContent).toBe('Hello World!')
    })
  })

  describe('memoization', () => {
    it('should memoize results when dependencies do not change', () => {
      let renderCount = 0

      function TestMemo() {
        const [count, setCount] = useState(0)
        const props = { label: 'Test' }
        const options = {
          label: {
            transform: (v: string) => {
              renderCount++
              return v
            },
          },
        }

        const composed = useComposableProps(props, options)

        return (
          <div>
            <div data-testid="label">{composed.label({})}</div>
            <button
              onClick={() => setCount((c) => c + 1)}
              data-testid="increment"
            >
              Count: {count}
            </button>
          </div>
        )
      }

      render(<TestMemo />)
      expect(renderCount).toBe(1)

      // Re-render without changing props/options
      userEvent.click(screen.getByTestId('increment'))
      expect(renderCount).toBe(1) // Should still be 1 due to memoization
    })

    it('should re-compute when dependencies change', async () => {
      const user = userEvent.setup()

      function TestDepsChange() {
        const [label, setLabel] = useState('Initial')
        const composed = useComposableProps({ label })

        return (
          <div>
            <div data-testid="label">{composed.label({})}</div>
            <button onClick={() => setLabel('Changed')} data-testid="change">
              Change Label
            </button>
          </div>
        )
      }

      render(<TestDepsChange />)
      expect(screen.getByTestId('label').textContent).toBe('Initial')

      await user.click(screen.getByTestId('change'))
      expect(screen.getByTestId('label').textContent).toBe('Changed')
    })

    it('should support custom dependency array', async () => {
      const user = userEvent.setup()

      function TestCustomDeps() {
        const [count, setCount] = useState(0)
        const [ignored, setIgnored] = useState(0)

        const composed = useComposableProps(
          { value: `Count: ${count}` },
          {},
          [count], // Only depend on count, not ignored
        )

        return (
          <div>
            <div data-testid="value">{composed.value({})}</div>
            <button onClick={() => setCount((c) => c + 1)} data-testid="count">
              Count
            </button>
            <button
              onClick={() => setIgnored((i) => i + 1)}
              data-testid="ignored"
            >
              Ignored: {ignored}
            </button>
          </div>
        )
      }

      render(<TestCustomDeps />)
      expect(screen.getByTestId('value').textContent).toBe('Count: 0')

      await user.click(screen.getByTestId('count'))
      expect(screen.getByTestId('value').textContent).toBe('Count: 1')
    })
  })
})
