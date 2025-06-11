# @noema/use-composable-props

React hooks that enable composable props patterns, allowing components to accept either static values or functions that receive render props.

## ✨ Features

- 🎯 **Dynamic Props**: Transform static props into dynamic functions that respond to component state. Choose between composable functions or pre-resolved values.
- 🔧 **Flexible Composition**: Compose props with transform and/or fallback logic
- 🎭 **TypeScript First**: Intelligent type inference

## 📦 Installation

```bash
npm install @noema/composed-props
```

```bash
yarn add @noema/composed-props
```

```bash
pnpm add @noema/composed-props
```

## 🚀 Quick Start

```tsx
import React, { useState, ReactNode } from 'react'
import { useComposedProps, ComposableProp } from '@noema/composed-props'

type State = { isHovered: boolean }
type Variant = 'primary' | 'secondary'
interface ButtonProps {
	children?: ComposableProp<State, ReactNode>
	className?: ComposableProp<State & { variant: Variant }, string>
	variant: Variant
}

function DynamicButton({ children, className, ...props }: ButtonProps) {
	const [isHovered, setIsHovered] = useState(false)

	const resolved = useComposedProps({ children, className }, {
    children: { isHovered },
    className: { isHovered, variant: 'primary' }
  })

	return (
		<button
			className={resolved.className}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			{...props}
		>
			{resolved.children}
		</button>
	)
}

// Usage
;<DynamicButton
	label={({ isHovered }) => (isHovered ? 'Click me! 🎯' : 'Hover me')}
	className={({ isHovered, variant }) => `btn ${isHovered && variant === 'primary ? 'btn-hover' : 'btn-normal'}`}
	variant="primary"
/>
```

## 📚 API Reference

### `useComposedProps(props, renderProps, options?)`

Returns all props already resolved/composed with the provided render props.

```tsx
const resolved = useComposedProps(props, state, options)
```

**Parameters:**

- `props` - Object containing your component props (some may be functions)
- `state` - State/context object passed to composable prop functions
- `options?` - Optional configuration for individual props

**Returns:** Object with all props resolved to their final values

### `useComposableProps(props, options?)`

Returns functions that can be called with render props to resolve values on-demand.

```tsx
const composed = useComposableProps(props, options)
```

**Parameters:**

- `props` - Object containing your component props
- `options?` - Optional configuration for individual props

**Returns:** Object with functions for each prop that accept render props

### `ComposeOptions<T, U, V>`

Configuration object for customizing prop composition behavior:

```tsx
interface ComposeOptions<T, U, V> {
	fallback?: (props: U) => V // Used when prop is undefined
	transform?: (value: V, props: U) => V // Transform final value
}
```

## 🎯 Examples

### With Options

```tsx
import { useComposableProps, ComposableProp } from '@noema/use-composable-props'

interface TooltipProps {
	content: ComposableProp<{ isOpen: boolean }, string>
	position: ComposableProp<{ isOpen: boolean }, 'top' | 'bottom'>
}

function Tooltip(props: TooltipProps) {
	const composed = useComposableProps(props, {
		content: {
			fallback: () => 'Default tooltip',
			transform: (content, state) => (state.isOpen ? content : ''),
		},
		position: {
			render: (staticPosition, state) =>
				state.isOpen ? staticPosition : 'top',
		},
	})

	const [isOpen, setIsOpen] = useState(false)
	const state = { isOpen }

	return (
		<div className={`tooltip tooltip-${composed.position(state)}`}>
			{composed.content(state)}
		</div>
	)
}
```

### Complex State Management

```tsx
import { useComposableProps, ComposableProp } from '@noema/use-composable-props'

interface DataTableProps {
  columns: ComposableProp<TableState, ColumnDef[]>
  data: ComposableProp<TableState, any[]>
  loading?: ComposableProp<TableState, boolean>
}

interface TableState {
  sortBy: string
  sortOrder: 'asc' | 'desc'
  filters: Record<string, any>
  pagination: { page: number; size: number }
}

function DataTable(props: DataTableProps) {
  const composed = useComposableProps(props)

  const [tableState, setTableState] = useState<TableState>({
    sortBy: '',
    sortOrder: 'asc',
    filters: {},
    pagination: { page: 1, size: 10 }
  })

  return (
    <div>
      {composed.loading?.(tableState) && <LoadingSpinner />}
      <table>
        <thead>
          {composed.columns(tableState).map(col => (
            <th key={col.key}>{col.title}</th>
          ))}
        </thead>
        <tbody>
          {composed.data(tableState).map((row, i) => (
            <tr key={i}>{/* render row */}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Usage
<DataTable
  columns={[
    { key: 'name', title: 'Name' },
    { key: 'email', title: 'Email' }
  ]}
  data={(state) =>
    users
      .filter(user => /* apply state.filters */)
      .sort((a, b) => /* apply state.sortBy and state.sortOrder */)
      .slice(/* apply state.pagination */)
  }
  loading={(state) => state.filters.search?.length > 0 && isSearching}
/>
```

## 🎭 TypeScript Support

The library is built with TypeScript and provides excellent type inference:

```tsx
interface MyProps {
	text: ComposableProp<AppState, string>
	count: ComposableProp<AppState, number>
}

// TypeScript automatically infers the correct types
const resolved = useComposedProps(props, state)
// resolved.text: string
// resolved.count: string
```

## 🤝 When to Use Each Hook

### `useComposedProps`

✅ **Use when:**

- You want convenience and clean syntax
- Render props are stable and don't change frequently
- You prefer declarative style
- You want all props resolved at once

### `useComposableProps`

✅ **Use when:**

- You need fine-grained control over when props are resolved
- Render props change frequently during render
- You want to optimize performance by avoiding unnecessary resolutions
- You need to call the same composable prop with different states
