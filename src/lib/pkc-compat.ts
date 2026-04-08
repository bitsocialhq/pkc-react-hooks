import assert from "assert";

export const getProtocolClient = (account: any) => account?.pkc;

export const getProtocolOptions = (account: any) => account?.pkcOptions;

export const getChainProviders = (account: any) => getProtocolOptions(account)?.chainProviders;

export const getRpcClients = (protocolClient: any) => protocolClient?.clients?.pkcRpcClients || {};

export const getPageRpcClients = (clients: any) => clients?.pkcRpcClients || {};

export const resolveAuthorNameWithProtocol = (
  protocolClient: any,
  options: { address?: string } | Record<string, any>,
) => {
  const resolveAuthorName =
    protocolClient?.resolveAuthorAddress || protocolClient?.resolveAuthorName;
  assert(
    typeof resolveAuthorName === "function",
    "protocol client resolveAuthorName/resolveAuthorAddress missing",
  );
  return resolveAuthorName.call(protocolClient, options);
};

export const normalizeOptionsForPkcClient = <T extends Record<string, any> | undefined>(
  options: T,
): T => {
  if (!options) {
    return options;
  }

  const normalized: Record<string, any> = { ...options };

  if (normalized.resolveAuthorNames == null && normalized.resolveAuthorAddresses != null) {
    normalized.resolveAuthorNames = normalized.resolveAuthorAddresses;
  }

  delete normalized.resolveAuthorAddresses;
  delete normalized.chainProviders;

  return normalized as T;
};

export const withProtocolAliases = <T extends Record<string, any>>(
  account: T,
  protocolClient?: any,
  protocolOptions?: any,
): T => {
  const nextAccount: Record<string, any> = { ...account };

  if (protocolClient !== undefined) {
    nextAccount.pkc = protocolClient;
  }
  if (protocolOptions !== undefined) {
    nextAccount.pkcOptions = protocolOptions;
  }

  return nextAccount as T;
};

export * from "./protocol-compat";
