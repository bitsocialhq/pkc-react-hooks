var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import assert from "assert";
import localForageLru from "../../lib/localforage-lru";
const communitiesDatabase = localForageLru.createInstance({
    name: "plebbitReactHooks-communities",
    size: 500,
});
import Logger from "@plebbit/plebbit-logger";
const log = Logger("bitsocial-react-hooks:communities:stores");
import utils from "../../lib/utils";
import createStore from "zustand";
import accountsStore from "../accounts";
import communitiesPagesStore from "../communities-pages";
import { createPlebbitCommunity, getPlebbitCommunity, getPlebbitCommunityAddresses, getPlebbitCreateCommunity, getPlebbitGetCommunity, } from "../../lib/plebbit-compat";
let plebbitGetCommunityPending = {};
// reset all event listeners in between tests
const listeners = [];
const communitiesStore = createStore((setState, getState) => ({
    communities: {},
    errors: {},
    addCommunityToStore(communityAddress, account) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(communityAddress !== "" && typeof communityAddress === "string", `communitiesStore.addCommunityToStore invalid communityAddress argument '${communityAddress}'`);
            assert(typeof getPlebbitCreateCommunity(account === null || account === void 0 ? void 0 : account.plebbit) === "function", `communitiesStore.addCommunityToStore invalid account argument '${account}'`);
            // community is in store already, do nothing
            const { communities } = getState();
            let community = communities[communityAddress];
            const pendingKey = communityAddress + account.id;
            if (community || plebbitGetCommunityPending[pendingKey]) {
                return;
            }
            // start trying to get community
            plebbitGetCommunityPending[pendingKey] = true;
            let errorGettingCommunity;
            try {
                // try to find community in owner communities
                if (getPlebbitCommunityAddresses(account.plebbit).includes(communityAddress)) {
                    try {
                        community = yield createPlebbitCommunity(account.plebbit, {
                            address: communityAddress,
                        });
                    }
                    catch (e) {
                        errorGettingCommunity = e;
                    }
                }
                // try to find community in database
                let fetchedAt;
                if (!community) {
                    const communityData = yield communitiesDatabase.getItem(communityAddress);
                    if (communityData) {
                        fetchedAt = communityData.fetchedAt;
                        delete communityData.fetchedAt; // not part of plebbit-js schema
                        try {
                            community = yield createPlebbitCommunity(account.plebbit, communityData);
                        }
                        catch (e) {
                            fetchedAt = undefined;
                            // need to log this always or it could silently fail in production and cache never be used
                            console.error("failed plebbit.createCommunity(cachedCommunity)", {
                                cachedCommunity: communityData,
                                error: e,
                            });
                        }
                    }
                    if (community) {
                        // add page comments to communitiesPagesStore so they can be used in useComment
                        communitiesPagesStore.getState().addCommunityPageCommentsToStore(community);
                    }
                }
                // community not in database, try to fetch from plebbit-js
                if (!community) {
                    try {
                        community = yield createPlebbitCommunity(account.plebbit, {
                            address: communityAddress,
                        });
                    }
                    catch (e) {
                        errorGettingCommunity = e;
                    }
                }
                // failure getting community
                if (!community) {
                    if (errorGettingCommunity) {
                        setState((state) => {
                            let communityErrors = state.errors[communityAddress] || [];
                            communityErrors = [...communityErrors, errorGettingCommunity];
                            return Object.assign(Object.assign({}, state), { errors: Object.assign(Object.assign({}, state.errors), { [communityAddress]: communityErrors }) });
                        });
                    }
                    throw (errorGettingCommunity ||
                        Error(`communitiesStore.addCommunityToStore failed getting community '${communityAddress}'`));
                }
                // success getting community
                const firstCommunityState = utils.clone(Object.assign(Object.assign({}, community), { fetchedAt }));
                yield communitiesDatabase.setItem(communityAddress, firstCommunityState);
                log("communitiesStore.addCommunityToStore", { communityAddress, community, account });
                setState((state) => ({
                    communities: Object.assign(Object.assign({}, state.communities), { [communityAddress]: firstCommunityState }),
                }));
                // the community has published new posts
                community.on("update", (updatedCommunity) => __awaiter(this, void 0, void 0, function* () {
                    updatedCommunity = utils.clone(updatedCommunity);
                    // add fetchedAt to be able to expire the cache
                    // NOTE: fetchedAt is undefined on owner communities because never stale
                    updatedCommunity.fetchedAt = Math.floor(Date.now() / 1000);
                    yield communitiesDatabase.setItem(communityAddress, updatedCommunity);
                    log("communitiesStore community update", {
                        communityAddress,
                        updatedCommunity,
                        account,
                    });
                    setState((state) => ({
                        communities: Object.assign(Object.assign({}, state.communities), { [communityAddress]: updatedCommunity }),
                    }));
                    // if a community has a role with an account's address add it to the account.communities
                    accountsStore
                        .getState()
                        .accountsActionsInternal.addCommunityRoleToAccountsCommunities(updatedCommunity);
                    // add page comments to communitiesPagesStore so they can be used in useComment
                    communitiesPagesStore.getState().addCommunityPageCommentsToStore(updatedCommunity);
                }));
                community.on("updatingstatechange", (updatingState) => {
                    setState((state) => ({
                        communities: Object.assign(Object.assign({}, state.communities), { [communityAddress]: Object.assign(Object.assign({}, state.communities[communityAddress]), { updatingState }) }),
                    }));
                });
                community.on("error", (error) => {
                    setState((state) => {
                        let communityErrors = state.errors[communityAddress] || [];
                        communityErrors = [...communityErrors, error];
                        return Object.assign(Object.assign({}, state), { errors: Object.assign(Object.assign({}, state.errors), { [communityAddress]: communityErrors }) });
                    });
                });
                // set clients on community so the frontend can display it, dont persist in db because a reload cancels updating
                utils.clientsOnStateChange(community === null || community === void 0 ? void 0 : community.clients, (clientState, clientType, clientUrl, chainTicker) => {
                    setState((state) => {
                        var _a;
                        // make sure not undefined, sometimes happens in e2e tests
                        if (!state.communities[communityAddress]) {
                            return {};
                        }
                        const clients = Object.assign({}, (_a = state.communities[communityAddress]) === null || _a === void 0 ? void 0 : _a.clients);
                        const client = { state: clientState };
                        if (chainTicker) {
                            const chainProviders = Object.assign(Object.assign({}, clients[clientType][chainTicker]), { [clientUrl]: client });
                            clients[clientType] = Object.assign(Object.assign({}, clients[clientType]), { [chainTicker]: chainProviders });
                        }
                        else {
                            clients[clientType] = Object.assign(Object.assign({}, clients[clientType]), { [clientUrl]: client });
                        }
                        return {
                            communities: Object.assign(Object.assign({}, state.communities), { [communityAddress]: Object.assign(Object.assign({}, state.communities[communityAddress]), { clients }) }),
                        };
                    });
                });
                listeners.push(community);
                community
                    .update()
                    .catch((error) => log.trace("community.update error", { community, error }));
            }
            finally {
                plebbitGetCommunityPending[pendingKey] = false;
            }
        });
    },
    refreshCommunity(communityAddress, account) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(communityAddress !== "" && typeof communityAddress === "string", `communitiesStore.refreshCommunity invalid communityAddress argument '${communityAddress}'`);
            assert(typeof getPlebbitGetCommunity(account === null || account === void 0 ? void 0 : account.plebbit) === "function", `communitiesStore.refreshCommunity invalid account argument '${account}'`);
            const refreshedCommunity = utils.clone(yield getPlebbitCommunity(account.plebbit, { address: communityAddress }));
            refreshedCommunity.fetchedAt = Math.floor(Date.now() / 1000);
            yield communitiesDatabase.setItem(communityAddress, refreshedCommunity);
            log("communitiesStore.refreshCommunity", {
                communityAddress,
                refreshedCommunity,
                account,
            });
            setState((state) => ({
                communities: Object.assign(Object.assign({}, state.communities), { [communityAddress]: refreshedCommunity }),
            }));
            communitiesPagesStore.getState().addCommunityPageCommentsToStore(refreshedCommunity);
            return refreshedCommunity;
        });
    },
    // user is the owner of the community and can edit it locally
    editCommunity(communityAddress, communityEditOptions, account) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(communityAddress !== "" && typeof communityAddress === "string", `communitiesStore.editCommunity invalid communityAddress argument '${communityAddress}'`);
            assert(communityEditOptions && typeof communityEditOptions === "object", `communitiesStore.editCommunity invalid communityEditOptions argument '${communityEditOptions}'`);
            assert(typeof getPlebbitCreateCommunity(account === null || account === void 0 ? void 0 : account.plebbit) === "function", `communitiesStore.editCommunity invalid account argument '${account}'`);
            // if not added to store first, community.update() is never called
            yield getState().addCommunityToStore(communityAddress, account);
            // `communityAddress` is different from  `communityEditOptions.address` when editing the community address
            const community = yield createPlebbitCommunity(account.plebbit, {
                address: communityAddress,
            });
            // could fix some test issues
            community.on("error", console.log);
            yield community.edit(communityEditOptions);
            const updatedCommunity = utils.clone(community);
            // edit db of both old and new community address to not break the UI
            yield communitiesDatabase.setItem(communityAddress, updatedCommunity);
            yield communitiesDatabase.setItem(community.address, updatedCommunity);
            log("communitiesStore.editCommunity", {
                communityAddress,
                communityEditOptions,
                community,
                account,
            });
            setState((state) => ({
                communities: Object.assign(Object.assign({}, state.communities), { 
                    // edit react state of both old and new community address to not break the UI
                    [communityAddress]: updatedCommunity, [community.address]: updatedCommunity }),
            }));
        });
    },
    // internal action called by accountsActions.createCommunity
    createCommunity(createCommunityOptions, account) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(!createCommunityOptions || typeof createCommunityOptions === "object", `communitiesStore.createCommunity invalid createCommunityOptions argument '${createCommunityOptions}'`);
            if (!(createCommunityOptions === null || createCommunityOptions === void 0 ? void 0 : createCommunityOptions.signer)) {
                assert(!(createCommunityOptions === null || createCommunityOptions === void 0 ? void 0 : createCommunityOptions.address), `communitiesStore.createCommunity createCommunityOptions.address '${createCommunityOptions === null || createCommunityOptions === void 0 ? void 0 : createCommunityOptions.address}' must be undefined to create a community`);
            }
            assert(typeof getPlebbitCreateCommunity(account === null || account === void 0 ? void 0 : account.plebbit) === "function", `communitiesStore.createCommunity invalid account argument '${account}'`);
            const community = yield createPlebbitCommunity(account.plebbit, createCommunityOptions);
            // could fix some test issues
            community.on("error", console.log);
            // if not added to store first, community.update() is never called
            yield getState().addCommunityToStore(community.address, account);
            yield communitiesDatabase.setItem(community.address, utils.clone(community));
            log("communitiesStore.createCommunity", { createCommunityOptions, community, account });
            setState((state) => ({
                communities: Object.assign(Object.assign({}, state.communities), { [community.address]: utils.clone(community) }),
            }));
            return community;
        });
    },
    // internal action called by accountsActions.deleteCommunity
    deleteCommunity(communityAddress, account) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(communityAddress && typeof communityAddress === "string", `communitiesStore.deleteCommunity invalid communityAddress argument '${communityAddress}'`);
            assert(typeof getPlebbitCreateCommunity(account === null || account === void 0 ? void 0 : account.plebbit) === "function", `communitiesStore.deleteCommunity invalid account argument '${account}'`);
            const community = yield createPlebbitCommunity(account.plebbit, {
                address: communityAddress,
            });
            // could fix some test issues
            community.on("error", console.log);
            yield community.delete();
            yield communitiesDatabase.removeItem(communityAddress);
            log("communitiesStore.deleteCommunity", { communityAddress, community, account });
            setState((state) => ({
                communities: Object.assign(Object.assign({}, state.communities), { [communityAddress]: undefined }),
            }));
        });
    },
}));
// reset store in between tests
const originalState = communitiesStore.getState();
// async function because some stores have async init
export const resetCommunitiesStore = () => __awaiter(void 0, void 0, void 0, function* () {
    plebbitGetCommunityPending = {};
    // remove all event listeners
    listeners.forEach((listener) => listener.removeAllListeners());
    // destroy all component subscriptions to the store
    communitiesStore.destroy();
    // restore original state
    communitiesStore.setState(originalState);
});
// reset database and store in between tests
export const resetCommunitiesDatabaseAndStore = () => __awaiter(void 0, void 0, void 0, function* () {
    yield localForageLru.createInstance({ name: "plebbitReactHooks-communities" }).clear();
    yield resetCommunitiesStore();
});
export default communitiesStore;
