declare global {
  interface Window {
    defaultPkcOptions?: {
      libp2pJsClientsOptions?: unknown;
      chainProviders?: Record<string, unknown>;
      [key: string]: unknown;
    };
    defaultPlebbitOptions?: {
      libp2pJsClientsOptions?: unknown;
      chainProviders?: Record<string, unknown>;
      [key: string]: unknown;
    };
    defaultMediaIpfsGatewayUrl?: string;
  }
}

export {};
