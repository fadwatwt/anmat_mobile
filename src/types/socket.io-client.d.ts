declare module 'socket.io-client' {
  export interface Socket {
    id: string;
    connected: boolean;
    disconnected: boolean;
    on(event: string, handler: (...args: any[]) => void): this;
    off(event: string, handler?: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    disconnect(): this;
    connect(): this;
  }

  export interface ManagerOptions {
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    transports?: string[];
    auth?: Record<string, any>;
  }

  export interface SocketOptions {
    query?: Record<string, string>;
  }

  export function io(
    uri?: string,
    opts?: Partial<ManagerOptions & SocketOptions>,
  ): Socket;
}
