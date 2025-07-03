import { ConnectionArgs } from '../graphql/inputs/ConnectionArgs';
import { CursorUtil } from './cursor.util';

export interface PaginationParams {
  limit: number;
  offset?: number;
  afterCursor?: { timestamp: Date; id: string };
  beforeCursor?: { timestamp: Date; id: string };
  direction: 'forward' | 'backward';
}

export class PaginationUtil {
  static parsePaginationArgs(args: ConnectionArgs): PaginationParams {
    const { first, after, last, before } = args;

    if (first && last) {
      throw new Error('Cannot provide both first and last');
    }
    if (after && before) {
      throw new Error('Cannot provide both after and before');
    }

    if (first !== undefined) {
      const result: PaginationParams = {
        limit: first + 1,
        direction: 'forward'
      };
      if (after) {
        result.afterCursor = CursorUtil.parseMessageCursor(after);
      }
      return result;
    }

    if (last !== undefined) {
      const result: PaginationParams = {
        limit: last + 1,
        direction: 'backward'
      };
      if (before) {
        result.beforeCursor = CursorUtil.parseMessageCursor(before);
      }
      return result;
    }

    return {
      limit: 51,
      direction: 'forward'
    };
  }

  static buildConnection<T extends { id: string; createdAt: Date }>(
    items: T[],
    args: ConnectionArgs,
    totalCount: number,
    direction: 'forward' | 'backward'
  ) {
    const { first, last, after, before } = args;
    const limit = first || last || 50;
    
    const hasMore = items.length > limit;
    if (hasMore) {
      items.pop(); // Remove the extra item used to check if there are more
    }

    const edges = items.map(item => ({
      node: item,
      cursor: CursorUtil.createMessageCursor(item)
    }));

    // Calculate pageInfo based on pagination direction and cursors
    let hasNextPage = false;
    let hasPreviousPage = false;

    if (first !== undefined) {
      // Forward pagination
      if (after) {
        // With cursor: normal forward pagination
        hasNextPage = hasMore;
        hasPreviousPage = true; // If we have an 'after' cursor, there are previous pages
      } else {
        // No cursor: showing most recent messages (like 'last' behavior)
        hasNextPage = false; // We're at the end (most recent)
        hasPreviousPage = hasMore; // There are older messages if we have more than requested
      }
    } else if (last !== undefined) {
      // Backward pagination
      hasPreviousPage = hasMore;
      hasNextPage = before ? true : false; // If we have a 'before' cursor, there are next pages
    }

    const pageInfo = {
      hasNextPage,
      hasPreviousPage,
      startCursor: edges.length > 0 ? edges[0]!.cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1]!.cursor : null
    };

    return {
      edges,
      pageInfo,
      totalCount
    };
  }

  static buildChatConnection<T extends { id: string; updatedAt: Date }>(
    items: T[],
    args: ConnectionArgs,
    totalCount: number
  ) {
    const { first, last } = args;
    const limit = first || last || 50;
    
    const hasMore = items.length > limit;
    if (hasMore) {
      items.pop();
    }

    if (last !== undefined) {
      items.reverse();
    }

    const edges = items.map(item => ({
      node: item,
      cursor: CursorUtil.createChatCursor(item)
    }));

    const pageInfo = {
      hasNextPage: first ? hasMore : false,
      hasPreviousPage: last ? hasMore : false,
      startCursor: edges.length > 0 ? edges[0]!.cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1]!.cursor : null
    };

    return {
      edges,
      pageInfo,
      totalCount
    };
  }

  static parseChatPaginationArgs(args: ConnectionArgs): PaginationParams {
    const { first, after, last, before } = args;

    if (first && last) {
      throw new Error('Cannot provide both first and last');
    }
    if (after && before) {
      throw new Error('Cannot provide both after and before');
    }

    if (first !== undefined) {
      const result: PaginationParams = {
        limit: first + 1,
        direction: 'forward'
      };
      if (after) {
        result.afterCursor = CursorUtil.parseChatCursor(after);
      }
      return result;
    }

    if (last !== undefined) {
      const result: PaginationParams = {
        limit: last + 1,
        direction: 'backward'
      };
      if (before) {
        result.beforeCursor = CursorUtil.parseChatCursor(before);
      }
      return result;
    }

    return {
      limit: 51,
      direction: 'forward'
    };
  }
} 