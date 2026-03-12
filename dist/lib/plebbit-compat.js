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
export const getPlebbitCreateCommunity = (plebbit) => (plebbit === null || plebbit === void 0 ? void 0 : plebbit.createCommunity) || (plebbit === null || plebbit === void 0 ? void 0 : plebbit.createSubplebbit);
export const getPlebbitGetCommunity = (plebbit) => (plebbit === null || plebbit === void 0 ? void 0 : plebbit.getCommunity) || (plebbit === null || plebbit === void 0 ? void 0 : plebbit.getSubplebbit);
export const getPlebbitCreateCommunityEdit = (plebbit) => (plebbit === null || plebbit === void 0 ? void 0 : plebbit.createCommunityEdit) || (plebbit === null || plebbit === void 0 ? void 0 : plebbit.createSubplebbitEdit);
export const getPlebbitCommunityAddresses = (plebbit) => {
    if (Array.isArray(plebbit === null || plebbit === void 0 ? void 0 : plebbit.communities)) {
        return plebbit.communities;
    }
    if (Array.isArray(plebbit === null || plebbit === void 0 ? void 0 : plebbit.subplebbits)) {
        return plebbit.subplebbits;
    }
    return [];
};
export const normalizePublicationOptionsForPlebbit = (_plebbit, options) => {
    var _a;
    const communityAddress = (_a = options.communityAddress) !== null && _a !== void 0 ? _a : options.subplebbitAddress;
    if (!communityAddress) {
        return options;
    }
    // The pinned plebbit-js dependency still documents and validates publication payloads with
    // legacy subplebbit* field names even when some community lifecycle methods are renamed.
    const normalized = Object.assign(Object.assign({}, options), { subplebbitAddress: communityAddress });
    delete normalized.communityAddress;
    return normalized;
};
export const normalizePublicationOptionsForStore = (options) => {
    var _a;
    const communityAddress = (_a = options.communityAddress) !== null && _a !== void 0 ? _a : options.subplebbitAddress;
    if (!communityAddress) {
        return options;
    }
    const normalized = Object.assign(Object.assign({}, options), { communityAddress });
    delete normalized.subplebbitAddress;
    return normalized;
};
export const normalizeCommunityEditOptionsForPlebbit = (plebbit, options) => {
    var _a;
    const normalized = normalizePublicationOptionsForPlebbit(plebbit, options);
    const editOptions = (_a = normalized.communityEdit) !== null && _a !== void 0 ? _a : normalized.subplebbitEdit;
    if (!editOptions) {
        return normalized;
    }
    normalized.subplebbitEdit = editOptions;
    delete normalized.communityEdit;
    return normalized;
};
export const getCommentCommunityAddress = (comment) => (comment === null || comment === void 0 ? void 0 : comment.communityAddress) || (comment === null || comment === void 0 ? void 0 : comment.subplebbitAddress);
const isLiveCommentInstance = (comment) => typeof (comment === null || comment === void 0 ? void 0 : comment.on) === "function" ||
    typeof (comment === null || comment === void 0 ? void 0 : comment.once) === "function" ||
    typeof (comment === null || comment === void 0 ? void 0 : comment.update) === "function";
export const normalizeCommentCommunityAddress = (comment) => {
    if (!comment || comment.communityAddress || !comment.subplebbitAddress) {
        return comment;
    }
    if (isLiveCommentInstance(comment)) {
        comment.communityAddress = comment.subplebbitAddress;
        return comment;
    }
    return Object.assign(Object.assign({}, comment), { communityAddress: comment.subplebbitAddress });
};
export const backfillPublicationCommunityAddress = (publication, options) => {
    var _a, _b;
    if (!publication || publication.communityAddress) {
        return publication;
    }
    const communityAddress = (_b = (_a = publication.subplebbitAddress) !== null && _a !== void 0 ? _a : options === null || options === void 0 ? void 0 : options.communityAddress) !== null && _b !== void 0 ? _b : options === null || options === void 0 ? void 0 : options.subplebbitAddress;
    if (!communityAddress) {
        return publication;
    }
    publication.communityAddress = communityAddress;
    return publication;
};
export const createPlebbitCommunity = (plebbit, options) => __awaiter(void 0, void 0, void 0, function* () {
    const createCommunity = getPlebbitCreateCommunity(plebbit);
    assert(typeof createCommunity === "function", "plebbit createCommunity/createSubplebbit missing");
    return createCommunity.call(plebbit, options);
});
export const getPlebbitCommunity = (plebbit, options) => __awaiter(void 0, void 0, void 0, function* () {
    const getCommunity = getPlebbitGetCommunity(plebbit);
    assert(typeof getCommunity === "function", "plebbit getCommunity/getSubplebbit missing");
    return getCommunity.call(plebbit, options);
});
export const createPlebbitCommunityEdit = (plebbit, options) => __awaiter(void 0, void 0, void 0, function* () {
    const createCommunityEdit = getPlebbitCreateCommunityEdit(plebbit);
    assert(typeof createCommunityEdit === "function", "plebbit createCommunityEdit/createSubplebbitEdit missing");
    return createCommunityEdit.call(plebbit, options);
});
