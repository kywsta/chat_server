import { DataEntity } from "../../entities/data-entity";

export interface Repository<T extends DataEntity> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(options?: FindOptions): Promise<T[]>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
}

export interface ConditionalFilter {
  key: string;
  value: any;
  operator: FilterOperator;
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  NOT_IN = 'nin',
  LIKE = 'like',
  NOT_LIKE = 'nlike',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull'
}

export interface FindOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filter?: Record<string, any>;
  conditionalFilters?: ConditionalFilter[];
}

// Pagination interfaces
export interface PaginatedMessages {
  messages: any[];
  totalCount: number;
}

export interface PaginatedChats {
  chats: any[];
  totalCount: number;
}

export interface PaginationParams {
  limit: number;
  afterCursor?: { timestamp: Date; id: string };
  beforeCursor?: { timestamp: Date; id: string };
  direction: 'forward' | 'backward';
} 