declare global {
  interface Window {
    defaultPkcOptions?: {
      libp2pJsClientsOptions?: unknown;
      chainProviders?: Record<string, unknown>;
      nameResolversChainProviders?: Record<string, unknown>;
      [key: string]: unknown;
    };
    defaultMediaIpfsGatewayUrl?: string;
  }
}

declare module "@bitsocial/bso-resolver" {
  export class BsoResolver {
    constructor(args: { key: string; provider: string; dataPath?: string });
    key: string;
    provider: string;
    dataPath?: string;
    canResolve(args: { name: string }): boolean;
    resolve(args: {
      name: string;
      abortSignal?: AbortSignal;
    }): Promise<{ publicKey: string; [key: string]: string } | undefined>;
    destroy(): Promise<void>;
  }
}

export {};
