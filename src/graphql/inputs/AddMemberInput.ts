import 'reflect-metadata';
import { Field, InputType } from 'type-graphql';
import { ChatMemberRole } from '../types/ChatMember';

@InputType()
export class AddMemberInput {
  @Field()
  chatId!: string;

  @Field()
  userId!: string;

  @Field(() => ChatMemberRole, { defaultValue: ChatMemberRole.MEMBER })
  role!: ChatMemberRole;
} 