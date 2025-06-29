import 'reflect-metadata';
import { Field, InputType } from 'type-graphql';
import { MessageType } from '../types/Message';

@InputType()
export class SendMessageInput {
  @Field()
  chatId!: string;

  @Field()
  content!: string;

  @Field(() => MessageType, { defaultValue: MessageType.TEXT })
  type!: MessageType;

  @Field({ nullable: true })
  replyToId?: string;
} 