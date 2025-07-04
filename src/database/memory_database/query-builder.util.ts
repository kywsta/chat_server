import { ConditionalFilter, FilterOperator, FindOptions } from '../../domain/repositories';

export class QueryBuilder {
  private filters: ConditionalFilter[] = [];
  private options: FindOptions = {};

  /**
   * Add a conditional filter
   */
  where(key: string, operator: FilterOperator, value: any): QueryBuilder {
    this.filters.push({ key, operator, value });
    return this;
  }

  /**
   * Add an equality filter (shorthand for where with EQUALS operator)
   */
  whereEquals(key: string, value: any): QueryBuilder {
    return this.where(key, FilterOperator.EQUALS, value);
  }

  /**
   * Add a not equals filter
   */
  whereNotEquals(key: string, value: any): QueryBuilder {
    return this.where(key, FilterOperator.NOT_EQUALS, value);
  }

  /**
   * Add a greater than filter
   */
  whereGreaterThan(key: string, value: any): QueryBuilder {
    return this.where(key, FilterOperator.GREATER_THAN, value);
  }

  /**
   * Add a greater than or equal filter
   */
  whereGreaterThanOrEqual(key: string, value: any): QueryBuilder {
    return this.where(key, FilterOperator.GREATER_THAN_OR_EQUAL, value);
  }

  /**
   * Add a less than filter
   */
  whereLessThan(key: string, value: any): QueryBuilder {
    return this.where(key, FilterOperator.LESS_THAN, value);
  }

  /**
   * Add a less than or equal filter
   */
  whereLessThanOrEqual(key: string, value: any): QueryBuilder {
    return this.where(key, FilterOperator.LESS_THAN_OR_EQUAL, value);
  }

  /**
   * Add an IN filter
   */
  whereIn(key: string, values: any[]): QueryBuilder {
    return this.where(key, FilterOperator.IN, values);
  }

  /**
   * Add a NOT IN filter
   */
  whereNotIn(key: string, values: any[]): QueryBuilder {
    return this.where(key, FilterOperator.NOT_IN, values);
  }

  /**
   * Add a LIKE filter (supports SQL-style wildcards % and _)
   */
  whereLike(key: string, pattern: string): QueryBuilder {
    return this.where(key, FilterOperator.LIKE, pattern);
  }

  /**
   * Add a NOT LIKE filter
   */
  whereNotLike(key: string, pattern: string): QueryBuilder {
    return this.where(key, FilterOperator.NOT_LIKE, pattern);
  }

  /**
   * Add a contains filter (case-insensitive substring search)
   */
  whereContains(key: string, value: string): QueryBuilder {
    return this.where(key, FilterOperator.CONTAINS, value);
  }

  /**
   * Add a starts with filter (case-insensitive)
   */
  whereStartsWith(key: string, value: string): QueryBuilder {
    return this.where(key, FilterOperator.STARTS_WITH, value);
  }

  /**
   * Add an ends with filter (case-insensitive)
   */
  whereEndsWith(key: string, value: string): QueryBuilder {
    return this.where(key, FilterOperator.ENDS_WITH, value);
  }

  /**
   * Add an IS NULL filter
   */
  whereNull(key: string): QueryBuilder {
    return this.where(key, FilterOperator.IS_NULL, null);
  }

  /**
   * Add an IS NOT NULL filter
   */
  whereNotNull(key: string): QueryBuilder {
    return this.where(key, FilterOperator.IS_NOT_NULL, null);
  }

  /**
   * Set ordering
   */
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.options.orderBy = field;
    this.options.orderDirection = direction;
    return this;
  }

  /**
   * Set limit
   */
  limit(count: number): QueryBuilder {
    this.options.limit = count;
    return this;
  }

  /**
   * Set offset
   */
  offset(count: number): QueryBuilder {
    this.options.offset = count;
    return this;
  }

  /**
   * Add basic filter (for backward compatibility)
   */
  filter(filterObj: Record<string, any>): QueryBuilder {
    this.options.filter = { ...this.options.filter, ...filterObj };
    return this;
  }

  /**
   * Build the final FindOptions object
   */
  build(): FindOptions {
    const result: FindOptions = { ...this.options };
    if (this.filters.length > 0) {
      result.conditionalFilters = this.filters;
    }
    return result;
  }

  /**
   * Static method to create a new QueryBuilder instance
   */
  static create(): QueryBuilder {
    return new QueryBuilder();
  }
} 