import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  username!: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  createdAt!: Date;

  @Field()
  isActive!: boolean;
} 