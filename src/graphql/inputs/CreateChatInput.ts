import 'reflect-metadata';
import { Field, InputType } from 'type-graphql';

@InputType()
export class CreateChatInput {
  @Field()
  name!: string;

  @Field(() => [String])
  memberIds!: string[];

  @Field(() => Boolean, { defaultValue: true })
  isGroup!: boolean;
} 