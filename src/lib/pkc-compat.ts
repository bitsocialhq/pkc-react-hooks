import assert from "assert";

export const getProtocolClient = (account: any) => account?.pkc || account?.plebbit;

export const getProtocolOptions = (account: any) => account?.pkcOptions || account?.plebbitOptions;

export const getChainProviders = (account: any) => getProtocolOptions(account)?.chainProviders;

export const getRpcClients = (protocolClient: any) =>
  protocolClient?.clients?.pkcRpcClients || protocolClient?.clients?.plebbitRpcClients || {};

export const getPageRpcClients = (clients: any) =>
  clients?.pkcRpcClients || clients?.plebbitRpcClients || {};

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

  if (normalized.pkcRpcClientsOptions == null && normalized.plebbitRpcClientsOptions != null) {
    normalized.pkcRpcClientsOptions = normalized.plebbitRpcClientsOptions;
  }
  if (normalized.resolveAuthorNames == null && normalized.resolveAuthorAddresses != null) {
    normalized.resolveAuthorNames = normalized.resolveAuthorAddresses;
  }

  delete normalized.plebbitRpcClientsOptions;
  delete normalized.resolveAuthorAddresses;
  delete normalized.chainProviders;

  return normalized as T;
};

export const withProtocolAliases = <T extends Record<string, any>>(
  account: T,
  protocolClient?: any,
  protocolOptions?: any,
): T => {
  const aliasedAccount: Record<string, any> = { ...account };
  const resolvedProtocolClient = protocolClient ?? aliasedAccount.pkc ?? aliasedAccount.plebbit;
  const resolvedProtocolOptions =
    protocolOptions ?? aliasedAccount.pkcOptions ?? aliasedAccount.plebbitOptions;

  if (resolvedProtocolClient !== undefined) {
    aliasedAccount.pkc = resolvedProtocolClient;
    aliasedAccount.plebbit = resolvedProtocolClient;
  }
  if (resolvedProtocolOptions !== undefined) {
    aliasedAccount.pkcOptions = resolvedProtocolOptions;
    aliasedAccount.plebbitOptions = resolvedProtocolOptions;
  }

  return aliasedAccount as T;
};
