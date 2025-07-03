import { ArgsType, Field } from 'type-graphql';
import { ConnectionArgs } from './ConnectionArgs';

@ArgsType()
export class MessageConnectionArgs extends ConnectionArgs {
  @Field()
  chatId!: string;

  @Field({ nullable: true })
  messageType?: string; // 'text', 'image', 'file', etc.
} 