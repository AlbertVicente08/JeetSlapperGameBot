declare module '@solana/web3.js' {
  export interface Commitment {
    commitment?: string;
  }
  export interface ConnectionConfig {
    commitment?: string;
    disableRetryOnRateLimit?: boolean;
    [key: string]: any;
  }
  export class Connection {
    constructor(endpoint: string, config?: ConnectionConfig);
  }
}
