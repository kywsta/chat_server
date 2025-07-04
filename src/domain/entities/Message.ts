import { DataEntity } from "./data-entity";

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

export interface MessageEntity extends DataEntity {
  chatId: string;
  userId: string;
  content: string;
  type: MessageType;
  replyToId?: string;
} 