# Conditional Filtering System

This document describes the enhanced conditional filtering system for the memory repositories.

## Overview

The memory repositories now support advanced conditional filtering with various operators, allowing for more flexible and powerful queries. The system maintains backward compatibility with the existing basic filter system.

## Features

### Supported Operators

- **EQUALS** (`eq`) - Exact match
- **NOT_EQUALS** (`ne`) - Not equal
- **GREATER_THAN** (`gt`) - Greater than
- **GREATER_THAN_OR_EQUAL** (`gte`) - Greater than or equal
- **LESS_THAN** (`lt`) - Less than
- **LESS_THAN_OR_EQUAL** (`lte`) - Less than or equal
- **IN** (`in`) - Value in array
- **NOT_IN** (`nin`) - Value not in array
- **LIKE** (`like`) - SQL-style pattern matching with % and _
- **NOT_LIKE** (`nlike`) - Negated LIKE
- **CONTAINS** (`contains`) - Case-insensitive substring search
- **STARTS_WITH** (`startsWith`) - Case-insensitive prefix match
- **ENDS_WITH** (`endsWith`) - Case-insensitive suffix match
- **IS_NULL** (`isNull`) - Value is null or undefined
- **IS_NOT_NULL** (`isNotNull`) - Value is not null or undefined

## Usage

### 1. Using QueryBuilder (Recommended)

```typescript
import { QueryBuilder } from '../utils/query-builder.util';

// Basic usage
const options = QueryBuilder.create()
  .whereEquals('chatId', 'chat-123')
  .whereGreaterThan('createdAt', new Date('2024-01-01'))
  .orderBy('createdAt', 'DESC')
  .limit(10)
  .build();

const messages = await messageRepository.findAll(options);
```

### 2. Using Raw Conditional Filters

```typescript
import { FilterOperator } from '../interfaces/database.interface';

const options = {
  conditionalFilters: [
    { key: 'chatId', operator: FilterOperator.EQUALS, value: 'chat-123' },
    { key: 'createdAt', operator: FilterOperator.GREATER_THAN, value: new Date('2024-01-01') }
  ],
  orderBy: 'createdAt',
  orderDirection: 'DESC' as const,
  limit: 10
};

const messages = await messageRepository.findAll(options);
```

### 3. Backward Compatibility

The existing basic filter system continues to work:

```typescript
// This still works
const options = {
  filter: { chatId: 'chat-123', type: 'text' },
  orderBy: 'createdAt',
  orderDirection: 'DESC' as const
};

const messages = await messageRepository.findAll(options);
```

## QueryBuilder Methods

### Filter Methods

- `whereEquals(key, value)` - Equality filter
- `whereNotEquals(key, value)` - Not equals filter
- `whereGreaterThan(key, value)` - Greater than filter
- `whereGreaterThanOrEqual(key, value)` - Greater than or equal filter
- `whereLessThan(key, value)` - Less than filter
- `whereLessThanOrEqual(key, value)` - Less than or equal filter
- `whereIn(key, values)` - IN filter
- `whereNotIn(key, values)` - NOT IN filter
- `whereLike(key, pattern)` - LIKE filter with SQL wildcards
- `whereNotLike(key, pattern)` - NOT LIKE filter
- `whereContains(key, value)` - Case-insensitive contains
- `whereStartsWith(key, value)` - Case-insensitive starts with
- `whereEndsWith(key, value)` - Case-insensitive ends with
- `whereNull(key)` - IS NULL filter
- `whereNotNull(key)` - IS NOT NULL filter

### Query Options

- `orderBy(field, direction)` - Set ordering
- `limit(count)` - Set limit
- `offset(count)` - Set offset
- `filter(filterObj)` - Add basic filter (backward compatibility)

## Examples

### Text Search

```typescript
// Find messages containing "hello" (case-insensitive)
const containsQuery = QueryBuilder.create()
  .whereEquals('chatId', 'chat-123')
  .whereContains('content', 'hello')
  .build();

// Find messages with SQL-like pattern
const likeQuery = QueryBuilder.create()
  .whereEquals('chatId', 'chat-123')
  .whereLike('content', '%urgent%')
  .build();
```

### Date Range Filtering

```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-12-31');

const dateRangeQuery = QueryBuilder.create()
  .whereEquals('chatId', 'chat-123')
  .whereGreaterThanOrEqual('createdAt', startDate)
  .whereLessThanOrEqual('createdAt', endDate)
  .orderBy('createdAt', 'ASC')
  .build();
```

### Complex Filtering

```typescript
const complexQuery = QueryBuilder.create()
  .whereEquals('chatId', 'chat-123')
  .whereNotEquals('userId', 'user-456') // Exclude specific user
  .whereIn('type', ['text', 'image'])
  .whereGreaterThan('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
  .whereContains('content', 'important')
  .whereNotNull('replyToId') // Only replies
  .orderBy('createdAt', 'DESC')
  .limit(20)
  .build();
```

## Implementation Details

### Filter Processing Order

1. Basic filters (backward compatibility)
2. Conditional filters
3. Sorting
4. Pagination (offset/limit)

### Performance Considerations

- Filters are applied in memory, so large datasets may impact performance
- Consider using indexes for frequently queried fields in production databases
- The system processes filters sequentially, so order matters for optimization

### Type Safety

The system maintains TypeScript type safety:
- Filter keys are validated against entity properties
- Operator types are enforced
- Value types are checked where possible

## Migration Guide

### From Basic Filters

```typescript
// Old way
const options = {
  filter: { chatId: 'chat-123', type: 'text' }
};

// New way (equivalent)
const options = QueryBuilder.create()
  .whereEquals('chatId', 'chat-123')
  .whereEquals('type', 'text')
  .build();
```

### Adding Advanced Conditions

```typescript
// Add date filtering to existing query
const options = QueryBuilder.create()
  .whereEquals('chatId', 'chat-123')
  .whereEquals('type', 'text')
  .whereGreaterThan('createdAt', new Date('2024-01-01'))
  .build();
```

## Best Practices

1. **Use QueryBuilder** for complex queries - it provides better readability and type safety
2. **Combine filters efficiently** - put more selective filters first
3. **Use appropriate operators** - CONTAINS for text search, IN for multiple values
4. **Consider performance** - limit result sets appropriately
5. **Maintain backward compatibility** - existing code continues to work

## Error Handling

The system throws descriptive errors for:
- Unsupported operators
- Invalid filter configurations
- Type mismatches

```typescript
try {
  const options = QueryBuilder.create()
    .where('field', 'INVALID_OPERATOR' as any, 'value')
    .build();
} catch (error) {
  console.error('Filter error:', error.message);
}
``` 