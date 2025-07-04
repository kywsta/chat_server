import { DataEntity } from "./data-entity";

export interface UserEntity extends DataEntity {
  username: string;
  email?: string;
  password: string;
  isActive: boolean;
} 