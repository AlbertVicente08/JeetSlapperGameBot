import { Connection, ConnectionConfig } from '@solana/web3.js';

export interface RpcEndpoint {
  name: string;
  url: string;
  weight: number;
}

const DEFAULT_ENDPOINTS: RpcEndpoint[] = [
  {
    name: 'HeliusFree',
    url: process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=YOUR_FREE_KEY',
    weight: 1,
  },
  {
    name: 'QuickNodeDiscover',
    url: process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL || 'https://example-solana.quiknode.pro/YOUR_FREE_KEY/',
    weight: 2,
  },
  {
    name: 'AnkrPublic',
    url: 'https://rpc.ankr.com/solana',
    weight: 3,
  },
  {
    name: 'SolanaOfficialPublic',
    url: 'https://api.mainnet-beta.solana.com',
    weight: 4,
  },
];

export class ResilientSolanaConnection {
  private currentIndex = 0;
  private connections: { endpoint: RpcEndpoint; connection: Connection }[];

  constructor(
    endpoints: RpcEndpoint[] = DEFAULT_ENDPOINTS,
    config: ConnectionConfig = { commitment: 'confirmed', disableRetryOnRateLimit: true }
  ) {
    this.connections = endpoints.map((endpoint) => ({
      endpoint,
      connection: new Connection(endpoint.url, {
        commitment: 'confirmed',
        ...config,
        // CRITICAL: disableRetryOnRateLimit prevents @solana/web3.js default 5-retry exponential backoff (15.5s+),
        // allowing HTTP 429 errors to fail fast immediately and trigger endpoint failover within Vercel's 10s execution window.
        disableRetryOnRateLimit: true,
      }),
    }));
  }

  /**
   * Executes a Solana Web3 operation with automatic failover rotation.
   * If an endpoint returns 429, timeouts, or network errors, it seamlessly switches to the next free provider.
   */
  public async execute<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    const totalEndpoints = this.connections.length;

    for (let attempt = 0; attempt < totalEndpoints; attempt++) {
      const activeIdx = (this.currentIndex + attempt) % totalEndpoints;
      const { endpoint, connection } = this.connections[activeIdx];

      try {
        const result = await operation(connection);
        this.currentIndex = activeIdx; // Sticky success: remember working endpoint
        return result;
      } catch (err: any) {
        lastError = err;
        console.warn(
          `[ResilientSolanaConnection] Endpoint '${endpoint.name}' failed: ${err.message || err}. Rotating to next endpoint...`
        );
      }
    }

    throw new Error(
      `[ResilientSolanaConnection] All ${totalEndpoints} free RPC endpoints failed. Last error: ${lastError?.message}`
    );
  }

  public getActiveEndpointName(): string {
    return this.connections[this.currentIndex].endpoint.name;
  }
}
