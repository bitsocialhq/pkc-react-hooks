// NOTE: don't import pkc-js directly to be able to replace the implementation

import PkcJsMockContent from "./pkc-js-mock-content";
import Logger from "@pkcprotocol/pkc-logger";
import assert from "assert";
const log = Logger("bitsocial-react-hooks:pkc-js");

let loadedDefaultPkc: any;

type ShortAddressParams = { address?: string; name?: string };

const getShortAddressValue = (params: ShortAddressParams = {}) => params.name ?? params.address;

const normalizeShortAddressParams = (params: ShortAddressParams = {}) => {
  const address = getShortAddressValue(params);
  return typeof address === "string" ? { ...params, address, name: address } : params;
};

const getFallbackShortAddress = (params: ShortAddressParams) => {
  const address = getShortAddressValue(params);
  if (typeof address !== "string") {
    return address;
  }
  if (address.includes(".")) {
    return address;
  }
  return address.substring(2, 14);
};

const getFallbackShortCid = ({ cid }: { cid?: string }) => {
  if (typeof cid !== "string") {
    return cid;
  }
  return cid.substring(2, 14);
};

const loadDefaultPkc = async () => {
  if (!loadedDefaultPkc) {
    const module = await import("@pkcprotocol/pkc-js");
    loadedDefaultPkc = module.default;
  }
  return loadedDefaultPkc;
};

const createLazyDefaultPkc = () => {
  const lazyPkc: any = async (...args: any[]) => {
    const PKC = await loadDefaultPkc();
    return PKC(...args);
  };
  lazyPkc.getShortAddress = (params: ShortAddressParams) =>
    loadedDefaultPkc?.getShortAddress
      ? loadedDefaultPkc.getShortAddress(normalizeShortAddressParams(params))
      : getFallbackShortAddress(params);
  lazyPkc.getShortCid = (params: { cid?: string }) =>
    loadedDefaultPkc?.getShortCid
      ? loadedDefaultPkc.getShortCid(params)
      : getFallbackShortCid(params);
  return lazyPkc;
};

let defaultPkc = createLazyDefaultPkc();

const protocolClient: any = {
  PKC: defaultPkc,
};

/**
 * Replace the underlying protocol client with a different implementation, for
 * example to mock it during unit tests, to add mock content
 * for developing the front-end or to add a PKC-compatible client with
 * desktop privileges in the Electron build.
 */
export function setPkcJs(_PKC: any) {
  assert(typeof _PKC === "function", `setPkcJs invalid PKC argument '${_PKC}' not a function`);
  protocolClient.PKC = _PKC;
  log("setPkcJs", _PKC?.name);
}

export function restorePkcJs() {
  defaultPkc = createLazyDefaultPkc();
  protocolClient.PKC = defaultPkc;
  log("restorePkcJs");
}

try {
  // mock content for front-end dev with this env var
  if (process.env.REACT_APP_BITSOCIAL_REACT_HOOKS_MOCK_CONTENT) {
    setPkcJs(PkcJsMockContent);
  }
} catch (e) {}

export default protocolClient;
