declare global {
  interface Window {
    defaultPlebbitOptions?: {
      libp2pJsClientsOptions?: unknown;
      chainProviders?: Record<string, unknown>;
      [key: string]: unknown;
    };
    defaultMediaIpfsGatewayUrl?: string;
  }
}

export {};
