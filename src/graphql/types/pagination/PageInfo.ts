import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;

  @Field(() => String, { nullable: true })
  startCursor?: string | null;

  @Field(() => String, { nullable: true })
  endCursor?: string | null;
} 