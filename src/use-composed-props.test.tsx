import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ComposableProp } from './types.js'
import { useComposedProps } from './use-composed-props.js'

interface TestState {
  isActive: boolean
  count: number
}

interface BasicProps {
  title: ComposableProp<TestState, string>
  className?: ComposableProp<TestState, string>
  isVisible?: ComposableProp<TestState, boolean>
}

function BasicTestComponent({ title, className, isVisible }: BasicProps) {
  const [isActive, setIsActive] = useState(false)
  const [count, setCount] = useState(1)

  const resolved = useComposedProps(
    { title, className, isVisible },
    {
      title: { isActive, count },
      className: { isActive, count },
      isVisible: { isActive, count },
    },
  )

  return (
    <div className={resolved.className} data-testid="container">
      <span data-testid="title">{resolved.title}</span>
      {resolved.isVisible && <div data-testid="content">Content</div>}
      <button onClick={() => setIsActive(!isActive)} data-testid="toggle">
        Toggle
      </button>
      <button onClick={() => setCount(count + 1)} data-testid="increment">
        Increment
      </button>
    </div>
  )
}

interface OptionsProps {
  title?: ComposableProp<TestState, string>
  className?: ComposableProp<TestState, string>
  count?: ComposableProp<TestState, number>
}

function OptionsTestComponent({ title, className, count }: OptionsProps) {
  const [isActive, setIsActive] = useState(false)

  const resolved = useComposedProps(
    { title, className, count },
    {
      title: { isActive, count: 5 },
      className: { isActive, count: 5 },
      count: { isActive, count: 5 },
    },
    {
      title: {
        fallback: () => 'Default Title',
      },
      className: {
        fallback: () => 'default-class',
        transform: (value, state) =>
          `${value} ${state.isActive ? 'active' : 'inactive'}`,
      },
      count: {
        default: 10,
        transform: (value = 0) => value * 2,
      },
    },
  )

  return (
    <div className={resolved.className} data-testid="container">
      <span data-testid="title">{resolved.title}</span>
      <span data-testid="count">{resolved.count}</span>
      <button onClick={() => setIsActive(!isActive)} data-testid="toggle">
        Toggle
      </button>
    </div>
  )
}

describe('useComposedProps', () => {
  it('resolves static and function props correctly', () => {
    const { getByTestId } = render(
      <BasicTestComponent
        title="Static Title"
        className={({ isActive }) => (isActive ? 'active' : 'inactive')}
        isVisible={true}
      />,
    )

    expect(getByTestId('title').textContent).toBe('Static Title')
    expect(getByTestId('container').className).toBe('inactive')
    expect(getByTestId('content')).toBeTruthy()

    fireEvent.click(getByTestId('toggle'))
    expect(getByTestId('container').className).toBe('active')
  })

  it('updates resolved values when state changes', () => {
    const { getByTestId } = render(
      <BasicTestComponent
        title={({ isActive, count }) =>
          `${isActive ? 'Active' : 'Inactive'} - ${count}`
        }
        className={({ isActive }) => `state-${isActive ? 'on' : 'off'}`}
        isVisible={({ count }) => count > 2}
      />,
    )

    expect(getByTestId('title').textContent).toBe('Inactive - 1')
    expect(getByTestId('container').className).toBe('state-off')
    expect(() => getByTestId('content')).toThrow()

    fireEvent.click(getByTestId('toggle'))
    expect(getByTestId('title').textContent).toBe('Active - 1')
    expect(getByTestId('container').className).toBe('state-on')

    fireEvent.click(getByTestId('increment'))
    fireEvent.click(getByTestId('increment'))
    expect(getByTestId('title').textContent).toBe('Active - 3')
    expect(getByTestId('content')).toBeTruthy()
  })

  it('applies fallback, default, and transform options', () => {
    const { getByTestId } = render(
      <OptionsTestComponent className="base" count={5} />,
    )

    expect(getByTestId('title').textContent).toBe('Default Title')
    expect(getByTestId('container').className).toBe('base inactive')
    expect(getByTestId('count').textContent).toBe('10')

    fireEvent.click(getByTestId('toggle'))
    expect(getByTestId('container').className).toBe('base active')
  })

  it('applies fallback when prop is undefined', () => {
    const { getByTestId } = render(<OptionsTestComponent />)

    expect(getByTestId('title').textContent).toBe('Default Title')
    expect(getByTestId('container').className).toBe('default-class inactive')
  })

  it('applies default value when prop is undefined', () => {
    const { getByTestId } = render(<OptionsTestComponent />)

    expect(getByTestId('count').textContent).toBe('20')
  })

  it('evaluates function props with correct state and tracks calls', () => {
    const titleFn = vi.fn(({ isActive, count }: TestState) =>
      isActive ? `Active ${count}` : `Inactive ${count}`,
    )

    const { getByTestId } = render(
      <BasicTestComponent title={titleFn} className="test" />,
    )

    expect(titleFn).toHaveBeenCalledTimes(1)
    expect(titleFn).toHaveBeenCalledWith(
      { isActive: false, count: 1 },
      undefined,
    )
    expect(getByTestId('title').textContent).toBe('Inactive 1')

    fireEvent.click(getByTestId('toggle'))
    expect(titleFn).toHaveBeenCalledTimes(2)
    expect(titleFn).toHaveBeenLastCalledWith(
      { isActive: true, count: 1 },
      undefined,
    )
    expect(getByTestId('title').textContent).toBe('Active 1')
  })

  it('re-evaluates when props change', () => {
    const { getByTestId, rerender } = render(
      <BasicTestComponent title="Title 1" className="class1" />,
    )

    expect(getByTestId('title').textContent).toBe('Title 1')
    expect(getByTestId('container').className).toBe('class1')

    rerender(<BasicTestComponent title="Title 2" className="class2" />)
    expect(getByTestId('title').textContent).toBe('Title 2')
    expect(getByTestId('container').className).toBe('class2')
  })
})
