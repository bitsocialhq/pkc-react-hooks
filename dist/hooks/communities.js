var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useEffect, useState, useMemo } from "react";
import { useAccount } from "./accounts";
import validator from "../lib/validator";
import Logger from "@plebbit/plebbit-logger";
const log = Logger("bitsocial-react-hooks:communities:hooks");
import assert from "assert";
import useInterval from "./utils/use-interval";
import createStore from "zustand";
import { resolveEnsTxtRecord } from "../lib/chain";
import useCommunitiesStore from "../stores/communities";
import shallow from "zustand/shallow";
import { getPlebbitCommunityAddresses } from "../lib/plebbit-compat";
/**
 * @param communityAddress - The address of the community, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useCommunity(options) {
    assert(!options || typeof options === "object", `useCommunity options argument '${options}' not an object`);
    const { communityAddress, accountName, onlyIfCached } = options !== null && options !== void 0 ? options : {};
    const account = useAccount({ accountName });
    const community = useCommunitiesStore((state) => state.communities[communityAddress || ""]);
    const addCommunityToStore = useCommunitiesStore((state) => state.addCommunityToStore);
    const errors = useCommunitiesStore((state) => state.errors[communityAddress || ""]);
    useEffect(() => {
        if (!communityAddress || !account) {
            return;
        }
        validator.validateUseCommunityArguments(communityAddress, account);
        if (!community && !onlyIfCached) {
            // if community isn't already in store, add it
            addCommunityToStore(communityAddress, account).catch((error) => log.error("useCommunity addCommunityToStore error", { communityAddress, error }));
        }
    }, [communityAddress, account === null || account === void 0 ? void 0 : account.id]);
    if (account && communityAddress) {
        log("useCommunity", { communityAddress, community, account });
    }
    let state = (community === null || community === void 0 ? void 0 : community.updatingState) || "initializing";
    // force succeeded even if the community is fecthing a new update
    if (community === null || community === void 0 ? void 0 : community.updatedAt) {
        state = "succeeded";
    }
    return useMemo(() => (Object.assign(Object.assign({}, community), { state, error: errors === null || errors === void 0 ? void 0 : errors[errors.length - 1], errors: errors || [] })), [community, communityAddress, errors]);
}
/**
 * @param communityAddress - The address of the community, e.g. 'memes.eth', '12D3KooW...', etc
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useCommunityStats(options) {
    assert(!options || typeof options === "object", `useCommunityStats options argument '${options}' not an object`);
    const { communityAddress, accountName, onlyIfCached } = options !== null && options !== void 0 ? options : {};
    const account = useAccount({ accountName });
    const community = useCommunity({ communityAddress, onlyIfCached });
    const communityStatsCid = community === null || community === void 0 ? void 0 : community.statsCid;
    const communityStats = useCommunitiesStatsStore((state) => state.communitiesStats[communityAddress || ""]);
    const setCommunityStats = useCommunitiesStatsStore((state) => state.setCommunityStats);
    const [fetchError, setFetchError] = useState();
    useEffect(() => {
        setFetchError(undefined);
        if (!communityAddress || !communityStatsCid || !account) {
            return;
        }
        let cancelled = false;
        (() => __awaiter(this, void 0, void 0, function* () {
            let fetchedCid;
            try {
                fetchedCid = yield account.plebbit.fetchCid({ cid: communityStatsCid });
                fetchedCid = JSON.parse(fetchedCid);
                if (cancelled) {
                    return;
                }
                setCommunityStats(communityAddress, fetchedCid);
            }
            catch (error) {
                const normalizedError = error instanceof Error ? error : new Error(typeof error === "string" ? error : "error");
                if (cancelled) {
                    return;
                }
                setFetchError(normalizedError);
                log.error("useCommunityStats plebbit.fetchCid error", {
                    communityAddress,
                    communityStatsCid,
                    community,
                    fetchedCid,
                    error: normalizedError,
                });
            }
        }))();
        return () => {
            cancelled = true;
        };
    }, [communityStatsCid, account === null || account === void 0 ? void 0 : account.id, communityAddress, setCommunityStats]);
    if (account && communityStatsCid) {
        log("useCommunityStats", {
            communityAddress,
            communityStatsCid,
            communityStats,
            community,
            account,
        });
    }
    const state = !communityAddress || !account || !communityStatsCid
        ? "uninitialized"
        : fetchError
            ? "failed"
            : communityStats
                ? "succeeded"
                : "fetching-ipfs";
    return useMemo(() => (Object.assign(Object.assign({}, communityStats), { state, error: fetchError, errors: fetchError ? [fetchError] : [] })), [communityStats, state, fetchError]);
}
const useCommunitiesStatsStore = createStore((setState) => ({
    communitiesStats: {},
    setCommunityStats: (communityAddress, communityStats) => setState((state) => ({
        communitiesStats: Object.assign(Object.assign({}, state.communitiesStats), { [communityAddress]: communityStats }),
    })),
}));
/**
 * @param communityAddresses - The addresses of the communities, e.g. ['memes.eth', '12D3KooWA...']
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useCommunities(options) {
    assert(!options || typeof options === "object", `useCommunities options argument '${options}' not an object`);
    const { communityAddresses = [], accountName, onlyIfCached } = options !== null && options !== void 0 ? options : {};
    const addrs = communityAddresses !== null && communityAddresses !== void 0 ? communityAddresses : [];
    const account = useAccount({ accountName });
    const communities = useCommunitiesStore((state) => addrs.map((communityAddress) => state.communities[communityAddress || ""]), shallow);
    const communitiesErrors = useCommunitiesStore((state) => addrs.map((communityAddress) => state.errors[communityAddress || ""]), shallow);
    const addCommunityToStore = useCommunitiesStore((state) => state.addCommunityToStore);
    useEffect(() => {
        if (!addrs.length || !account) {
            return;
        }
        validator.validateUseCommunitiesArguments(addrs, account);
        if (onlyIfCached) {
            return;
        }
        const uniqueCommunityAddresses = new Set(addrs);
        for (const communityAddress of uniqueCommunityAddresses) {
            addCommunityToStore(communityAddress, account).catch((error) => log.error("useCommunities addCommunityToStore error", { communityAddress, error }));
        }
    }, [addrs.toString(), account === null || account === void 0 ? void 0 : account.id]);
    if (account && addrs.length) {
        log("useCommunities", { communityAddresses: addrs, communities, account });
    }
    const errors = useMemo(() => communitiesErrors.flatMap((communityErrors) => communityErrors || []), [communitiesErrors]);
    const hasFailedCommunity = communities.some((community, index) => { var _a; return !community && Boolean((_a = communitiesErrors[index]) === null || _a === void 0 ? void 0 : _a.length); });
    const state = hasFailedCommunity
        ? "failed"
        : communities.indexOf(undefined) === -1
            ? "succeeded"
            : "fetching-ipns";
    return useMemo(() => ({
        communities,
        state,
        error: errors[errors.length - 1],
        errors,
    }), [communities, state, errors, addrs.toString()]);
}
// TODO: plebbit.listCommunities() has been removed, rename this and use event communitieschanged instead of polling
/**
 * Returns all the owner communities created by plebbit-js by calling plebbit.listCommunities()
 */
export function useListCommunities(accountName) {
    const account = useAccount({ accountName });
    const [communityAddresses, setCommunityAddresses] = useState([]);
    const delay = 1000;
    const immediate = true;
    useInterval(() => {
        const plebbit = account === null || account === void 0 ? void 0 : account.plebbit;
        if (!plebbit)
            return;
        const newAddrs = getPlebbitCommunityAddresses(plebbit);
        if (newAddrs.toString() !== communityAddresses.toString()) {
            log("useListCommunities", { communityAddresses });
            setCommunityAddresses(newAddrs);
        }
    }, delay, immediate);
    return communityAddresses;
}
/**
 * @param communityAddress - The community address to resolve to a public key, e.g. 'news.eth' resolves to '12D3KooW...'.
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
// NOTE: useResolvedCommunityAddress tests are skipped, if changes are made they must be tested manually
export function useResolvedCommunityAddress(options) {
    var _a;
    assert(!options || typeof options === "object", `useResolvedCommunityAddress options argument '${options}' not an object`);
    let { communityAddress, accountName, cache } = options !== null && options !== void 0 ? options : {};
    // cache by default
    if (typeof cache !== "boolean") {
        cache = true;
    }
    // poll every 15 seconds, about the duration of an eth block
    let interval = 15000;
    // no point in polling often if caching is on
    if (cache) {
        interval = 1000 * 60 * 60 * 25;
    }
    const account = useAccount({ accountName });
    // possible to use account.plebbit instead of account.plebbitOptions
    const chainProviders = (_a = account === null || account === void 0 ? void 0 : account.plebbitOptions) === null || _a === void 0 ? void 0 : _a.chainProviders;
    const [resolvedAddress, setResolvedAddress] = useState();
    const [errors, setErrors] = useState([]);
    const [state, setState] = useState();
    let initialState = "initializing";
    // before those defined, nothing can happen
    if (options && account && communityAddress) {
        initialState = "ready";
    }
    useInterval(() => {
        if (!account || !communityAddress) {
            setResolvedAddress(undefined);
            setState(undefined);
            setErrors((prevErrors) => (prevErrors.length ? [] : prevErrors));
            return;
        }
        // address isn't a crypto domain, can't be resolved
        if (!(communityAddress === null || communityAddress === void 0 ? void 0 : communityAddress.includes("."))) {
            if (state !== "failed") {
                setErrors([Error("not a crypto domain")]);
                setState("failed");
                setResolvedAddress(undefined);
            }
            return;
        }
        // only support resolving '.eth' for now
        if (!(communityAddress === null || communityAddress === void 0 ? void 0 : communityAddress.endsWith(".eth"))) {
            if (state !== "failed") {
                setErrors([Error("crypto domain type unsupported")]);
                setState("failed");
                setResolvedAddress(undefined);
            }
            return;
        }
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                setState("resolving");
                const res = yield resolveCommunityAddress(communityAddress, chainProviders);
                setState("succeeded");
                if (res !== resolvedAddress) {
                    setResolvedAddress(res);
                }
            }
            catch (error) {
                setErrors([...errors, error]);
                setState("failed");
                setResolvedAddress(undefined);
                log.error("useResolvedCommunityAddress resolveCommunityAddress error", {
                    communityAddress,
                    chainProviders,
                    error,
                });
            }
        }))();
    }, interval, true, [communityAddress, chainProviders]);
    // only support ENS at the moment
    const chainProvider = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders["eth"];
    // log('useResolvedCommunityAddress', {communityAddress, state, errors, resolvedAddress, chainProviders})
    return {
        resolvedAddress,
        chainProvider,
        state: state || initialState,
        error: errors[errors.length - 1],
        errors,
    };
}
// NOTE: resolveCommunityAddress tests are skipped, if changes are made they must be tested manually
export const resolveCommunityAddress = (communityAddress, chainProviders) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    let resolvedCommunityAddress;
    if (communityAddress.endsWith(".eth")) {
        resolvedCommunityAddress = yield resolveEnsTxtRecord(communityAddress, "community-address", "eth", (_b = (_a = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders["eth"]) === null || _a === void 0 ? void 0 : _a.urls) === null || _b === void 0 ? void 0 : _b[0], (_c = chainProviders === null || chainProviders === void 0 ? void 0 : chainProviders["eth"]) === null || _c === void 0 ? void 0 : _c.chainId);
    }
    else {
        throw Error(`resolveCommunityAddress invalid communityAddress '${communityAddress}'`);
    }
    return resolvedCommunityAddress;
});
