export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getHealth(): Promise<DatabaseHealth>;
  healthCheck(): Promise<{
    isHealthy: boolean;
    details?: any;
  }>;
}

export interface DatabaseHealth {
  isHealthy: boolean;
  timestamp: Date;
  details?: any;
}