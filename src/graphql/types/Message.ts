import 'reflect-metadata';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
}

registerEnumType(MessageType, {
  name: 'MessageType',
  description: 'The type of message content',
});

@ObjectType()
export class Message {
  @Field(() => ID)
  id!: string;

  @Field()
  chatId!: string;

  @Field()
  userId!: string;

  @Field()
  content!: string;

  @Field(() => MessageType)
  type!: MessageType;

  @Field({ nullable: true })
  replyToId?: string;

  @Field()
  createdAt!: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
} 