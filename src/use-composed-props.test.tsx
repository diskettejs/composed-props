import { render, screen } from '@testing-library/react'
import React, { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { ComposableProp } from './types.js'
import { useComposedProps } from './use-composed-props.js'

interface CardState {
  isExpanded: boolean
  variant: 'primary' | 'secondary'
}

interface ImageState {
  isLoaded: boolean
  hasError: boolean
}

describe('useComposedProps', () => {
  describe('basic functionality', () => {
    interface ButtonProps {
      label: ComposableProp<{ isActive: boolean }, string>
      className: ComposableProp<{ theme: string }, string>
    }

    function Button({ label, className }: ButtonProps) {
      const resolved = useComposedProps(
        { label, className },
        {
          label: { isActive: true },
          className: { theme: 'dark' },
        },
      )

      return (
        <button data-testid="button" className={resolved.className}>
          {resolved.label}
        </button>
      )
    }

    it('should resolve static props', () => {
      render(<Button label="Static Label" className="btn-static" />)

      const button = screen.getByTestId('button')
      expect(button.textContent).toBe('Static Label')
      expect(button.className).toBe('btn-static')
    })

    it('should resolve function props with provided state', () => {
      render(
        <Button
          label={({ isActive }) => (isActive ? 'Active' : 'Inactive')}
          className={({ theme }) => `btn-${theme}`}
        />,
      )

      const button = screen.getByTestId('button')
      expect(button.textContent).toBe('Active')
      expect(button.className).toBe('btn-dark')
    })

    it('should handle mixed static and function props', () => {
      render(
        <Button
          label="Mixed Label"
          className={({ theme }) => `btn-${theme}-mixed`}
        />,
      )

      const button = screen.getByTestId('button')
      expect(button.textContent).toBe('Mixed Label')
      expect(button.className).toBe('btn-dark-mixed')
    })
  })

  describe('options handling', () => {
    interface StatusCardProps {
      title?: ComposableProp<{ userName: string }, string>
      status?: ComposableProp<{ isOnline: boolean }, string>
      className?: ComposableProp<{ priority: number }, string>
    }

    function StatusCard({ title, status, className }: StatusCardProps) {
      const resolved = useComposedProps(
        { title, status, className },
        {
          title: { userName: 'John' },
          status: { isOnline: true },
          className: { priority: 5 },
        },
        {
          title: {
            default: 'Default Title',
          },
          status: {
            fallback: ({ isOnline }) => (isOnline ? 'Online' : 'Offline'),
            transform: (value) => `Status: ${value}`,
          },
          className: {
            default: 'card',
            transform: (value, { priority }) => `${value} priority-${priority}`,
          },
        },
      )

      return (
        <div data-testid="card" className={resolved.className}>
          <h3 data-testid="title">{resolved.title}</h3>
          <span data-testid="status">{resolved.status}</span>
        </div>
      )
    }

    it('should use default values when prop is undefined', () => {
      render(<StatusCard />)

      expect(screen.getByTestId('title').textContent).toBe('Default Title')
      expect(screen.getByTestId('card').className).toBe('card priority-5')
    })

    it('should apply fallback when prop is undefined', () => {
      render(<StatusCard />)

      expect(screen.getByTestId('status').textContent).toBe('Status: Online')
    })

    it('should apply transform functions', () => {
      render(
        <StatusCard
          title="Custom Title"
          status="Away"
          className="custom-card"
        />,
      )

      expect(screen.getByTestId('title').textContent).toBe('Custom Title')
      expect(screen.getByTestId('status').textContent).toBe('Status: Away')
      expect(screen.getByTestId('card').className).toBe(
        'custom-card priority-5',
      )
    })

    it('should handle function props with options', () => {
      render(
        <StatusCard
          title={({ userName }) => `Welcome ${userName}`}
          status={({ isOnline }) => (isOnline ? 'Available' : 'Busy')}
        />,
      )

      expect(screen.getByTestId('title').textContent).toBe('Welcome John')
      expect(screen.getByTestId('status').textContent).toBe('Status: Available')
    })
  })

  describe('state mapping', () => {
    interface MultiStateProps {
      cardTitle: ComposableProp<CardState, string>
      imageUrl: ComposableProp<ImageState, string>
      buttonLabel: ComposableProp<{ count: number }, string>
    }

    function MultiStateComponent({
      cardTitle,
      imageUrl,
      buttonLabel,
    }: MultiStateProps) {
      const resolved = useComposedProps(
        { cardTitle, imageUrl, buttonLabel },
        {
          cardTitle: { isExpanded: false, variant: 'primary' },
          imageUrl: { isLoaded: true, hasError: false },
          buttonLabel: { count: 3 },
        },
      )

      return (
        <div>
          <h2 data-testid="card-title">{resolved.cardTitle}</h2>
          <img data-testid="image" src={resolved.imageUrl} alt="test" />
          <button data-testid="button">{resolved.buttonLabel}</button>
        </div>
      )
    }

    it('should map different state objects to different props', () => {
      render(
        <MultiStateComponent
          cardTitle={({ isExpanded, variant }) =>
            `${variant.toUpperCase()} - ${isExpanded ? 'Open' : 'Closed'}`
          }
          imageUrl={({ isLoaded, hasError }) =>
            hasError ? '/error.jpg' : isLoaded ? '/image.jpg' : '/loading.jpg'
          }
          buttonLabel={({ count }) => `Click me (${count})`}
        />,
      )

      expect(screen.getByTestId('card-title').textContent).toBe(
        'PRIMARY - Closed',
      )
      expect((screen.getByTestId('image') as HTMLImageElement).src).toContain(
        '/image.jpg',
      )
      expect(screen.getByTestId('button').textContent).toBe('Click me (3)')
    })

    it('should handle static values with state mapping', () => {
      render(
        <MultiStateComponent
          cardTitle="Static Title"
          imageUrl="/static.jpg"
          buttonLabel="Static Button"
        />,
      )

      expect(screen.getByTestId('card-title').textContent).toBe('Static Title')
      expect((screen.getByTestId('image') as HTMLImageElement).src).toContain(
        '/static.jpg',
      )
      expect(screen.getByTestId('button').textContent).toBe('Static Button')
    })
  })

  describe('memoization', () => {
    let renderCount = 0

    function MemoTest() {
      const [count, setCount] = useState(0)
      const [theme, setTheme] = useState('light')

      renderCount++

      const resolved = useComposedProps(
        {
          label: ({ count }: { count: number }) => `Count: ${count}`,
          className: 'test-class',
        },
        {
          label: { count },
          className: { theme },
        },
      )

      return (
        <div>
          <div data-testid="label">{resolved.label}</div>
          <div data-testid="class">{resolved.className}</div>
          <button data-testid="increment" onClick={() => setCount(count + 1)}>
            Increment
          </button>
          <button
            data-testid="toggle-theme"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            Toggle Theme
          </button>
        </div>
      )
    }

    it('should memoize results when dependencies do not change', () => {
      renderCount = 0
      render(<MemoTest />)

      expect(renderCount).toBe(1)
      expect(screen.getByTestId('label').textContent).toBe('Count: 0')
    })

    it('should support custom dependency array', () => {
      function CustomDepsTest() {
        const [ignored, setIgnored] = useState(0)
        const [tracked, setTracked] = useState('initial')

        const resolved = useComposedProps(
          {
            value: () => `Tracked: ${tracked}`,
          },
          {
            value: {},
          },
          {},
          [tracked], // Only track 'tracked', ignore 'ignored'
        )

        return (
          <div>
            <div data-testid="value">{resolved.value}</div>
            <div data-testid="ignored">{ignored}</div>
            <button
              data-testid="change-ignored"
              onClick={() => setIgnored(ignored + 1)}
            >
              Change Ignored
            </button>
            <button
              data-testid="change-tracked"
              onClick={() => setTracked('changed')}
            >
              Change Tracked
            </button>
          </div>
        )
      }

      render(<CustomDepsTest />)
      expect(screen.getByTestId('value').textContent).toBe('Tracked: initial')
    })
  })

  describe('edge cases', () => {
    it('should handle empty props object', () => {
      function EmptyPropsTest() {
        const resolved = useComposedProps({}, {})
        return <div data-testid="empty">Empty: {JSON.stringify(resolved)}</div>
      }

      render(<EmptyPropsTest />)
      expect(screen.getByTestId('empty').textContent).toBe('Empty: {}')
    })

    it('should handle optional props correctly', () => {
      interface OptionalProps {
        required: ComposableProp<{ id: number }, string>
        optional?: ComposableProp<{ id: number }, string>
      }

      function OptionalTest({ required, optional }: OptionalProps) {
        const resolved = useComposedProps(
          { required, optional },
          {
            required: { id: 1 },
            optional: { id: 1 },
          },
          {
            optional: { default: 'Default Optional' },
          },
        )

        return (
          <div>
            <div data-testid="required">{resolved.required}</div>
            <div data-testid="optional">{resolved.optional}</div>
          </div>
        )
      }

      render(<OptionalTest required="Required Value" />)
      expect(screen.getByTestId('required').textContent).toBe('Required Value')
      expect(screen.getByTestId('optional').textContent).toBe(
        'Default Optional',
      )
    })
  })
})
