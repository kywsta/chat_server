import { ObjectType } from 'type-graphql';
import { Chat } from '../Chat';
import { createConnectionType } from './Connection';
import { createEdgeType } from './Edge';

@ObjectType()
export class ChatConnection extends createConnectionType(Chat) {}

@ObjectType()
export class ChatEdge extends createEdgeType(Chat) {} 