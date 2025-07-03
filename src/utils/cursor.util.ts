export class CursorUtil {
  /**
   * Encode a value to base64 cursor
   */
  static encode(value: string | number | Date): string {
    const stringValue = value instanceof Date ? value.toISOString() : String(value);
    return Buffer.from(stringValue).toString('base64');
  }

  /**
   * Decode base64 cursor to string
   */
  static decode(cursor: string): string {
    try {
      return Buffer.from(cursor, 'base64').toString('utf-8');
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  /**
   * Decode cursor to Date (for timestamp-based pagination)
   */
  static decodeToDate(cursor: string): Date {
    const decoded = this.decode(cursor);
    const date = new Date(decoded);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date cursor');
    }
    return date;
  }

  /**
   * Create cursor from message (using createdAt timestamp)
   */
  static createMessageCursor(message: { id: string; createdAt: Date }): string {
    return this.encode(`${message.createdAt.toISOString()}_${message.id}`);
  }

  /**
   * Parse message cursor
   */
  static parseMessageCursor(cursor: string): { timestamp: Date; id: string } {
    const decoded = this.decode(cursor);
    const [timestampStr, id] = decoded.split('_');
    if (!timestampStr || !id) {
      throw new Error('Invalid message cursor format');
    }
    return {
      timestamp: new Date(timestampStr),
      id
    };
  }

  /**
   * Create cursor from chat (using updatedAt timestamp)
   */
  static createChatCursor(chat: { id: string; updatedAt: Date }): string {
    return this.encode(`${chat.updatedAt.toISOString()}_${chat.id}`);
  }

  /**
   * Parse chat cursor
   */
  static parseChatCursor(cursor: string): { timestamp: Date; id: string } {
    const decoded = this.decode(cursor);
    const [timestampStr, id] = decoded.split('_');
    if (!timestampStr || !id) {
      throw new Error('Invalid chat cursor format');
    }
    return {
      timestamp: new Date(timestampStr),
      id
    };
  }
} 