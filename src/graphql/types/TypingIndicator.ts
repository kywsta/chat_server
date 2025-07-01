import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class TypingIndicator {
  @Field()
  chatId: string = '';

  @Field()
  userId: string = '';

  @Field()
  username: string = '';

  @Field()
  isTyping: boolean = false;
} 