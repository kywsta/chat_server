import { ClassType, Field, ObjectType } from 'type-graphql';
import { createEdgeType } from './Edge';
import { PageInfo } from './PageInfo';

export function createConnectionType<T extends object>(nodeType: ClassType<T>) {
  const EdgeType = createEdgeType(nodeType);
  
  @ObjectType(`${nodeType.name}Connection`)
  class Connection {
    @Field(() => [EdgeType])
    edges!: InstanceType<typeof EdgeType>[];

    @Field(() => PageInfo)
    pageInfo!: PageInfo;

    @Field()
    totalCount!: number;
  }
  return Connection;
} 