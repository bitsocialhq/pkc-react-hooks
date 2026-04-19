// NOTE: don't import pkc-js directly to be able to replace the implementation
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import PkcJsMockContent from "./pkc-js-mock-content.js";
import Logger from "@pkc/pkc-logger";
import assert from "assert";
const log = Logger("bitsocial-react-hooks:pkc-js");
let loadedDefaultPkc;
const getShortAddressValue = (params = {}) => { var _a; return (_a = params.name) !== null && _a !== void 0 ? _a : params.address; };
const normalizeShortAddressParams = (params = {}) => {
    const address = getShortAddressValue(params);
    return typeof address === "string" ? Object.assign(Object.assign({}, params), { address, name: address }) : params;
};
const getFallbackShortAddress = (params) => {
    const address = getShortAddressValue(params);
    if (typeof address !== "string") {
        return address;
    }
    if (address.includes(".")) {
        return address;
    }
    return address.substring(2, 14);
};
const getFallbackShortCid = ({ cid }) => {
    if (typeof cid !== "string") {
        return cid;
    }
    return cid.substring(2, 14);
};
const loadDefaultPkc = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!loadedDefaultPkc) {
        const module = yield import("@pkcprotocol/pkc-js");
        loadedDefaultPkc = module.default;
    }
    return loadedDefaultPkc;
});
const createLazyDefaultPkc = () => {
    const lazyPkc = (...args) => __awaiter(void 0, void 0, void 0, function* () {
        const PKC = yield loadDefaultPkc();
        return PKC(...args);
    });
    lazyPkc.getShortAddress = (params) => (loadedDefaultPkc === null || loadedDefaultPkc === void 0 ? void 0 : loadedDefaultPkc.getShortAddress)
        ? loadedDefaultPkc.getShortAddress(normalizeShortAddressParams(params))
        : getFallbackShortAddress(params);
    lazyPkc.getShortCid = (params) => (loadedDefaultPkc === null || loadedDefaultPkc === void 0 ? void 0 : loadedDefaultPkc.getShortCid)
        ? loadedDefaultPkc.getShortCid(params)
        : getFallbackShortCid(params);
    return lazyPkc;
};
let defaultPkc = createLazyDefaultPkc();
const protocolClient = {
    PKC: defaultPkc,
};
/**
 * Replace the underlying protocol client with a different implementation, for
 * example to mock it during unit tests, to add mock content
 * for developing the front-end or to add a PKC-compatible client with
 * desktop privileges in the Electron build.
 */
export function setPkcJs(_PKC) {
    assert(typeof _PKC === "function", `setPkcJs invalid PKC argument '${_PKC}' not a function`);
    protocolClient.PKC = _PKC;
    log("setPkcJs", _PKC === null || _PKC === void 0 ? void 0 : _PKC.name);
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
}
catch (e) { }
export default protocolClient;
//# sourceMappingURL=index.js.map