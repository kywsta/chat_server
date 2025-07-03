import { ArgsType, Field } from 'type-graphql';
import { ConnectionArgs } from './ConnectionArgs';

@ArgsType()
export class ChatConnectionArgs extends ConnectionArgs {
  @Field({ nullable: true })
  searchTerm?: string;

  @Field({ nullable: true })
  isGroup?: boolean;
} 