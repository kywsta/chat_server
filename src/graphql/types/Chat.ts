import 'reflect-metadata';
import { Field, ID, ObjectType } from 'type-graphql';
import { ChatMember } from './ChatMember';

@ObjectType()
export class Chat {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  creatorId!: string;

  @Field(() => [String])
  memberIds!: string[];

  @Field(() => [ChatMember])
  members!: ChatMember[];

  @Field()
  isGroup!: boolean;

  @Field({ nullable: true })
  lastMessageId?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
} 