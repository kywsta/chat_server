import { DataEntity } from "./data-entity";

export enum ChatMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface ChatMemberEntity extends DataEntity {
  chatId: string;
  userId: string;
  role: ChatMemberRole;
  joinedAt: Date;
  isActive: boolean;
} 