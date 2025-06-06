# @noema/use-composable-props

A React hook that enables composable props patterns, allowing components to accept either static values or functions that receive render props.

## Installation

```bash
npm install @noema/use-composable-props
```

## Overview

`useComposableProps` transforms props that can be either static values or functions into consistent render functions, enabling flexible component APIs that support both simple static usage and advanced render prop patterns.

## Basic Usage

```tsx
import { useComposableProps, ComposableProp } from '@noema/use-composable-props'

interface ButtonProps {
  label: ComposableProp<{ isHovered: boolean }, string>
  icon: ComposableProp<{ isHovered: boolean }, React.ReactNode>
  className?: string
}

function Button(props: ButtonProps) {
  const { composed, rest } = useComposableProps(props, ['label', 'icon'])
  const [isHovered, setIsHovered] = useState(false)

  const state = { isHovered }

  return (
    <button
      {...rest}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {composed.icon(state)}
      {composed.label(state)}
    </button>
  )
}

// Usage with static values
<Button label="Click me" icon={<StarIcon />} />

// Usage with render functions
<Button
  label={(state) => state.isHovered ? "Click me!" : "Click me"}
  icon={(state) => state.isHovered ? <StarFilledIcon /> : <StarIcon />}
/>
```

## API Reference

### `useComposableProps(props, keys, options?)`

#### Parameters

- **`props`** (`T extends Record<string, any>`): The component props object
- **`keys`** (`readonly (keyof T)[]`): Array of prop keys to convert to render functions
- **`options?`** (`OptionsMap<T, K>`): Optional configuration for each key

#### Returns

```tsx
{
	composed: ComposedFns<T, K> // Object with render functions for each key
	rest: Omit<T, K[number]> // Remaining props not converted
}
```

### Types

#### `ComposableProp<T, V>`

```tsx
type ComposableProp<T, V> = V | ((props: T) => V)
```

A prop that can be either a static value `V` or a function that receives props `T` and returns `V`.

#### `ComposeOptions<T, U, V>`

```tsx
type ComposeOptions<T, U, V extends T> = {
	fallback?: (props: U) => V // Used when value is undefined
	render?: (prevValue: T, props: U) => V // Custom renderer for static values
	transform?: (prevValue: V, props: U) => V // Transform the final result
}
```

## Advanced Usage

### With Options

```tsx
import { useComposableProps, ComposableProp } from '@noema/use-composable-props'

interface TooltipProps {
	content: ComposableProp<{ isOpen: boolean }, string>
	position: ComposableProp<{ isOpen: boolean }, 'top' | 'bottom'>
}

function Tooltip(props: TooltipProps) {
	const { composed, rest } = useComposableProps(
		props,
		['content', 'position'],
		{
			content: {
				fallback: () => 'Default tooltip',
				transform: (content, state) => (state.isOpen ? content : ''),
			},
			position: {
				render: (staticPosition, state) =>
					state.isOpen ? staticPosition : 'top',
			},
		},
	)

	const [isOpen, setIsOpen] = useState(false)
	const state = { isOpen }

	return (
		<div className={`tooltip tooltip-${composed.position(state)}`}>
			{render.content(state)}
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
  const { composed, rest } = useComposableProps(
    props,
    ['columns', 'data', 'loading']
  )

  const [tableState, setTableState] = useState<TableState>({
    sortBy: '',
    sortOrder: 'asc',
    filters: {},
    pagination: { page: 1, size: 10 }
  })

  return (
    <div {...rest}>
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

## Use Cases

### 1. Conditional Rendering

Perfect for components that need to render different content based on internal state:

```tsx
<Button
	label={(state) => (state.loading ? 'Loading...' : 'Submit')}
	disabled={(state) => state.loading}
/>
```

### 2. Dynamic Styling

Enable responsive or stateful styling:

```tsx
<Card
	className={(state) => `card ${state.isSelected ? 'selected' : ''}`}
	style={(state) => ({ opacity: state.isDisabled ? 0.5 : 1 })}
/>
```

## TypeScript Support

The library is fully typed and provides excellent TypeScript support:

```tsx
import { ComposableProp } from '@noema/use-composable-props'

// The hook automatically infers types from your props
interface MyProps {
	text: ComposableProp<AppState, string>
	count: ComposableProp<AppState, number>
	flag: boolean
}

// TypeScript knows that composed.text and composed.count are functions
// that accept AppState and return string/number respectively
const { composed, rest } = useComposableProps(props, ['text', 'count'])

// composed.text: (state: AppState) => string
// composed.count: (state: AppState) => number
// rest: { flag: boolean }
```
