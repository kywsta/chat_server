import { FilterOperator } from '../interfaces/database.interface';
import { QueryBuilder } from '../utils/query-builder.util';

/**
 * Examples of using the new conditional filtering system
 */

// Example 1: Basic conditional filters
export function exampleBasicFiltering() {
  // Find messages created after a specific date
  const afterDateQuery = QueryBuilder.create()
    .whereEquals('chatId', 'chat-123')
    .whereGreaterThan('createdAt', new Date('2024-01-01'))
    .orderBy('createdAt', 'DESC')
    .limit(10)
    .build();

  // Find messages with specific types
  const messageTypesQuery = QueryBuilder.create()
    .whereEquals('chatId', 'chat-123')
    .whereIn('type', ['text', 'image'])
    .build();

  return { afterDateQuery, messageTypesQuery };
}

// Example 2: Text search with LIKE operator
export function exampleTextSearch() {
  // Find messages containing specific text (case-insensitive)
  const containsQuery = QueryBuilder.create()
    .whereEquals('chatId', 'chat-123')
    .whereContains('content', 'hello')
    .build();

  // Find messages with SQL-like pattern matching
  const likeQuery = QueryBuilder.create()
    .whereEquals('chatId', 'chat-123')
    .whereLike('content', '%urgent%')
    .build();

  // Find messages starting with specific text
  const startsWithQuery = QueryBuilder.create()
    .whereEquals('chatId', 'chat-123')
    .whereStartsWith('content', 'Hello')
    .build();

  return { containsQuery, likeQuery, startsWithQuery };
}

// Example 3: Date range filtering
export function exampleDateRangeFiltering() {
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-12-31');

  const dateRangeQuery = QueryBuilder.create()
    .whereEquals('chatId', 'chat-123')
    .whereGreaterThanOrEqual('createdAt', startDate)
    .whereLessThanOrEqual('createdAt', endDate)
    .orderBy('createdAt', 'ASC')
    .build();

  return dateRangeQuery;
}

// Example 4: Complex filtering with multiple conditions
export function exampleComplexFiltering() {
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

  return complexQuery;
}

// Example 5: Using raw conditional filters (without QueryBuilder)
export function exampleRawConditionalFilters() {
  return {
    conditionalFilters: [
      { key: 'chatId', operator: FilterOperator.EQUALS, value: 'chat-123' },
      { key: 'createdAt', operator: FilterOperator.GREATER_THAN, value: new Date('2024-01-01') },
      { key: 'type', operator: FilterOperator.IN, value: ['text', 'image'] },
      { key: 'content', operator: FilterOperator.CONTAINS, value: 'hello' }
    ],
    orderBy: 'createdAt',
    orderDirection: 'DESC' as const,
    limit: 10
  };
}

// Example 6: Backward compatibility with basic filters
export function exampleBackwardCompatibility() {
  // This still works with the old filter system
  const basicFilterQuery = {
    filter: { chatId: 'chat-123', type: 'text' },
    orderBy: 'createdAt',
    orderDirection: 'DESC' as const,
    limit: 10
  };

  // You can also combine basic filters with conditional filters
  const combinedQuery = QueryBuilder.create()
    .filter({ chatId: 'chat-123' }) // Basic filter
    .whereGreaterThan('createdAt', new Date('2024-01-01')) // Conditional filter
    .build();

  return { basicFilterQuery, combinedQuery };
} 