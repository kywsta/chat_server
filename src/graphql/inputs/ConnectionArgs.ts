import { Max, Min } from 'class-validator';
import { ArgsType, Field, Int } from 'type-graphql';

@ArgsType()
export class ConnectionArgs {
  @Field(() => Int, { nullable: true })
  @Min(1)
  @Max(100)
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string;

  @Field(() => Int, { nullable: true })
  @Min(1)
  @Max(100)
  last?: number;

  @Field(() => String, { nullable: true })
  before?: string;
} 