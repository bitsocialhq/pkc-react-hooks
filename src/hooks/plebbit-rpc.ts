import { useState, useMemo, useEffect } from "react";
import { useAccount } from "./accounts";
import assert from "assert";
import {
  UsePkcRpcSettingsResult,
  UsePlebbitRpcSettingsOptions,
  UsePlebbitRpcSettingsResult,
  PlebbitRpcSettings,
} from "../types";
import { getProtocolClient, getRpcClients } from "../lib/pkc-compat";

const getFirstRpcClient = (protocolClient: any) =>
  Object.values(getRpcClients(protocolClient) || {})[0] as any;

/**
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function usePlebbitRpcSettings(
  options?: UsePlebbitRpcSettingsOptions,
): UsePlebbitRpcSettingsResult {
  assert(
    !options || typeof options === "object",
    `usePlebbitRpcSettings options argument '${options}' not an object`,
  );
  const { accountName } = options ?? {};
  const account = useAccount({ accountName });
  const protocolClient = getProtocolClient(account);
  const rpcClient = getFirstRpcClient(protocolClient);
  const [plebbitRpcSettingsState, setPlebbitRpcSettingsState] = useState<PlebbitRpcSettings>();
  const [state, setState] = useState<string>("initializing");
  const [errors, setErrors] = useState<Error[]>([]);

  useEffect(() => {
    if (!account || !protocolClient) return;
    if (!rpcClient) return;

    if (rpcClient.settings != null) setPlebbitRpcSettingsState(rpcClient.settings);
    const rpcState = rpcClient.state;
    if (rpcState != null && rpcState !== "") setState(rpcState);

    const onRpcSettingsChange = (plebbitRpcSettings: PlebbitRpcSettings) => {
      setPlebbitRpcSettingsState(plebbitRpcSettings);
    };
    const onRpcStateChange = (rpcState: string) => {
      setState(rpcState);
    };
    const onRpcError = (e: any) => {
      setErrors((prevErrors) => [...prevErrors, e]);
    };

    rpcClient.on("settingschange", onRpcSettingsChange);
    rpcClient.on("statechange", onRpcStateChange);
    rpcClient.on("error", onRpcError);

    // clean up
    return () => {
      rpcClient.removeListener("settingschange", onRpcSettingsChange);
      rpcClient.removeListener("statechange", onRpcStateChange);
      rpcClient.removeListener("error", onRpcError);
    };
  }, [account?.id, rpcClient, protocolClient]);

  const setPlebbitRpcSettings = async (plebbitRpcSettings: PlebbitRpcSettings) => {
    assert(account, `can't use usePlebbitRpcSettings.setPlebbitRpcSettings before initialized`);
    assert(
      plebbitRpcSettings && typeof plebbitRpcSettings === "object",
      `usePlebbitRpcSettings.setPlebbitRpcSettings plebbitRpcSettings argument '${plebbitRpcSettings}' not an object`,
    );
    const currentRpcClient = getFirstRpcClient(getProtocolClient(account));
    assert(
      currentRpcClient,
      `can't use usePlebbitRpcSettings.setPlebbitRpcSettings no account.plebbit.clients.plebbitRpcClients`,
    );

    try {
      await currentRpcClient.setSettings(plebbitRpcSettings);
      setState("succeeded");
    } catch (e: any) {
      setErrors((prevErrors) => [...prevErrors, e]);
      setState("failed");
    }

    const rpcStateAfter = currentRpcClient.state;
    setTimeout(() => {
      setState((prevState) => {
        if (prevState !== rpcStateAfter && rpcStateAfter != null && rpcStateAfter !== "") {
          return rpcStateAfter;
        }
        return prevState;
      });
    }, 10000);
  };

  const setPkcRpcSettings = setPlebbitRpcSettings;

  return useMemo(
    () => ({
      pkcRpcSettings: plebbitRpcSettingsState,
      plebbitRpcSettings: plebbitRpcSettingsState,
      setPkcRpcSettings,
      setPlebbitRpcSettings,
      state,
      error: errors?.[errors.length - 1],
      errors,
    }),
    [plebbitRpcSettingsState, account?.id, state, errors],
  );
}

export const usePkcRpcSettings = (
  options?: UsePlebbitRpcSettingsOptions,
): UsePkcRpcSettingsResult => usePlebbitRpcSettings(options);
