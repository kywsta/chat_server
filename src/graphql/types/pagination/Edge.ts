import { ClassType, Field, ObjectType } from 'type-graphql';

export function createEdgeType<T extends object>(nodeType: ClassType<T>) {
  @ObjectType(`${nodeType.name}Edge`)
  class Edge {
    @Field(() => nodeType)
    node!: T;

    @Field()
    cursor!: string;
  }
  return Edge;
} 