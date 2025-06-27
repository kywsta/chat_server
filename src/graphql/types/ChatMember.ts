import 'reflect-metadata';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

export enum ChatMemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

registerEnumType(ChatMemberRole, {
  name: 'ChatMemberRole',
  description: 'The role of a user in a chat',
});

@ObjectType()
export class ChatMember {
  @Field(() => ID)
  id!: string;

  @Field()
  chatId!: string;

  @Field()
  userId!: string;

  @Field(() => ChatMemberRole)
  role!: ChatMemberRole;

  @Field()
  joinedAt!: Date;

  @Field()
  isActive!: boolean;
} 