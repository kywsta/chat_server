import 'reflect-metadata';
import { Field, ID, ObjectType } from 'type-graphql';

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

  @Field()
  isGroup!: boolean;

  @Field({ nullable: true })
  lastMessageId?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
} 