import { ObjectType } from 'type-graphql';
import { Message } from '../Message';
import { createConnectionType } from './Connection';
import { createEdgeType } from './Edge';

@ObjectType()
export class MessageConnection extends createConnectionType(Message) {}

@ObjectType()
export class MessageEdge extends createEdgeType(Message) {} 