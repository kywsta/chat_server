import { DataEntity } from "./data-entity";

export interface ChatEntity extends DataEntity {
  name: string;
  creatorId: string;
  memberIds: string[];
  isGroup: boolean;
  lastMessageId?: string;
} 