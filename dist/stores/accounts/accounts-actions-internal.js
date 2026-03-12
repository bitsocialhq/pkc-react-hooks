// internal accounts actions that are not called by the user
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import accountsStore, { listeners } from "./accounts-store";
import accountsDatabase from "./accounts-database";
import Logger from "@plebbit/plebbit-logger";
import assert from "assert";
const log = Logger("bitsocial-react-hooks:accounts:stores");
import utils from "../../lib/utils";
import { backfillPublicationCommunityAddress, getCommentCommunityAddress, normalizePublicationOptionsForPlebbit, normalizePublicationOptionsForStore, } from "../../lib/plebbit-compat";
import { addShortAddressesToAccountComment } from "./utils";
const backfillLiveCommentCommunityAddress = (comment, communityAddress) => {
    if (!comment || comment.communityAddress || !communityAddress) {
        return;
    }
    try {
        Object.defineProperty(comment, "communityAddress", {
            value: communityAddress,
            writable: true,
            configurable: true,
            enumerable: false,
        });
    }
    catch (error) {
        try {
            comment.communityAddress = communityAddress;
        }
        catch (assignmentError) {
            log.trace("backfillLiveCommentCommunityAddress failed", {
                cid: comment.cid,
                error,
                assignmentError,
            });
        }
    }
};
// TODO: we currently subscribe to updates for every single comment
// in the user's account history. This probably does not scale, we
// need to eventually schedule and queue older comments to look
// for updates at a lower priority.
export const startUpdatingAccountCommentOnCommentUpdateEvents = (comment, account, accountCommentIndex) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    assert(typeof accountCommentIndex === "number", `startUpdatingAccountCommentOnCommentUpdateEvents accountCommentIndex '${accountCommentIndex}' not a number`);
    assert(typeof (account === null || account === void 0 ? void 0 : account.id) === "string", `startUpdatingAccountCommentOnCommentUpdateEvents account '${account}' account.id '${account === null || account === void 0 ? void 0 : account.id}' not a string`);
    const commentArgument = comment;
    // comment doesn't have a cid yet, so can't receive updates
    if (!comment.cid) {
        return;
    }
    // account comment already updating
    if (accountsStore.getState().accountsCommentsUpdating[comment.cid]) {
        return;
    }
    accountsStore.setState(({ accountsCommentsUpdating }) => ({
        accountsCommentsUpdating: Object.assign(Object.assign({}, accountsCommentsUpdating), { [comment.cid]: true }),
    }));
    // comment is not a `Comment` instance
    if (!comment.on) {
        comment = backfillPublicationCommunityAddress(yield account.plebbit.createComment(normalizePublicationOptionsForPlebbit(account.plebbit, comment)), comment);
    }
    const initialStoredComment = (_a = accountsStore.getState().accountsComments[account.id]) === null || _a === void 0 ? void 0 : _a[accountCommentIndex];
    backfillLiveCommentCommunityAddress(comment, getCommentCommunityAddress(commentArgument) ||
        (initialStoredComment === null || initialStoredComment === void 0 ? void 0 : initialStoredComment.communityAddress) ||
        (initialStoredComment === null || initialStoredComment === void 0 ? void 0 : initialStoredComment.subplebbitAddress));
    comment.on("update", (updatedComment) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const mapping = accountsStore.getState().commentCidsToAccountsComments[updatedComment.cid || ""];
        if (!mapping || mapping.accountId !== account.id) {
            accountsStore.setState(({ accountsCommentsUpdating }) => {
                const next = Object.assign({}, accountsCommentsUpdating);
                delete next[updatedComment.cid || ""];
                return { accountsCommentsUpdating: next };
            });
            try {
                if (typeof comment.removeAllListeners === "function")
                    comment.removeAllListeners();
                if (typeof comment.stop === "function")
                    comment.stop();
            }
            catch (e) {
                log.trace("startUpdatingAccountCommentOnCommentUpdateEvents stop/removeAllListeners", {
                    cid: updatedComment.cid,
                    error: e,
                });
            }
            return;
        }
        const currentIndex = mapping.accountCommentIndex;
        // merge should not be needed if plebbit-js is implemented properly, but no harm in fixing potential errors
        const storedComment = (_a = accountsStore.getState().accountsComments[account.id]) === null || _a === void 0 ? void 0 : _a[currentIndex];
        updatedComment = utils.merge(commentArgument, comment, updatedComment);
        updatedComment.communityAddress =
            getCommentCommunityAddress(updatedComment) ||
                getCommentCommunityAddress(comment) ||
                getCommentCommunityAddress(commentArgument) ||
                (storedComment === null || storedComment === void 0 ? void 0 : storedComment.communityAddress) ||
                (storedComment === null || storedComment === void 0 ? void 0 : storedComment.subplebbitAddress);
        updatedComment = addShortAddressesToAccountComment(normalizePublicationOptionsForStore(updatedComment));
        if ((_b = updatedComment.replies) === null || _b === void 0 ? void 0 : _b.pages) {
            updatedComment = Object.assign(Object.assign({}, updatedComment), { replies: Object.assign(Object.assign({}, updatedComment.replies), { pages: Object.fromEntries(Object.entries(updatedComment.replies.pages).map(([pageCid, page]) => [
                        pageCid,
                        (page === null || page === void 0 ? void 0 : page.comments)
                            ? Object.assign(Object.assign({}, page), { comments: page.comments.map((reply) => normalizePublicationOptionsForStore(reply)) }) : page,
                    ])) }) });
        }
        yield accountsDatabase.addAccountComment(account.id, updatedComment, currentIndex);
        log("startUpdatingAccountCommentOnCommentUpdateEvents comment update", {
            commentCid: comment.cid,
            accountCommentIndex: currentIndex,
            updatedComment,
            account,
        });
        accountsStore.setState(({ accountsComments }) => {
            // account no longer exists
            if (!accountsComments[account.id]) {
                log.error(`startUpdatingAccountCommentOnCommentUpdateEvents comment.on('update') invalid accountsStore.accountsComments['${account.id}'] '${accountsComments[account.id]}', account may have been deleted`);
                return {};
            }
            const updatedAccountComments = [...accountsComments[account.id]];
            const previousComment = updatedAccountComments[currentIndex];
            const updatedAccountComment = utils.clone(Object.assign(Object.assign({}, updatedComment), { index: currentIndex, accountId: account.id }));
            updatedAccountComments[currentIndex] = updatedAccountComment;
            return { accountsComments: Object.assign(Object.assign({}, accountsComments), { [account.id]: updatedAccountComments }) };
        });
        // update AccountCommentsReplies with new replies if has any new replies
        const replyPageArray = Object.values(((_c = updatedComment.replies) === null || _c === void 0 ? void 0 : _c.pages) || {});
        const getReplyCount = (replyPage) => { var _a, _b; return (_b = (_a = replyPage === null || replyPage === void 0 ? void 0 : replyPage.comments) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0; };
        const replyCount = replyPageArray.length > 0
            ? replyPageArray.map(getReplyCount).reduce((prev, curr) => prev + curr)
            : 0;
        const hasReplies = replyCount > 0;
        const repliesAreValid = yield utils.repliesAreValid(updatedComment, { validateReplies: false, blockCommunity: true }, account.plebbit);
        if (hasReplies && repliesAreValid) {
            accountsStore.setState(({ accountsCommentsReplies }) => {
                var _a, _b;
                // account no longer exists
                if (!accountsCommentsReplies[account.id]) {
                    log.error(`startUpdatingAccountCommentOnCommentUpdateEvents comment.on('update') invalid accountsStore.accountsCommentsReplies['${account.id}'] '${accountsCommentsReplies[account.id]}', account may have been deleted`);
                    return {};
                }
                // check which replies are read or not
                const updatedAccountCommentsReplies = {};
                for (const replyPage of replyPageArray) {
                    for (const reply of (replyPage === null || replyPage === void 0 ? void 0 : replyPage.comments) || []) {
                        const markedAsRead = ((_b = (_a = accountsCommentsReplies[account.id]) === null || _a === void 0 ? void 0 : _a[reply.cid]) === null || _b === void 0 ? void 0 : _b.markedAsRead) === true
                            ? true
                            : false;
                        updatedAccountCommentsReplies[reply.cid] = Object.assign(Object.assign({}, reply), { markedAsRead });
                    }
                }
                // add all to database
                const promises = [];
                for (const replyCid in updatedAccountCommentsReplies) {
                    promises.push(accountsDatabase.addAccountCommentReply(account.id, updatedAccountCommentsReplies[replyCid]));
                }
                Promise.all(promises);
                // set new store
                const newAccountCommentsReplies = Object.assign(Object.assign({}, accountsCommentsReplies[account.id]), updatedAccountCommentsReplies);
                return {
                    accountsCommentsReplies: Object.assign(Object.assign({}, accountsCommentsReplies), { [account.id]: newAccountCommentsReplies }),
                };
            });
        }
    }));
    listeners.push(comment);
    comment.update().catch((error) => log.trace("comment.update error", { comment, error }));
});
// internal accounts action: the comment CID is not known at the time of publishing, so every time
// we fetch a new comment, check if its our own, and attempt to add the CID
export const addCidToAccountComment = (comment) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { accounts } = accountsStore.getState();
    assert(accounts, `can't use accountsStore.accountActions before initialized`);
    const accountCommentsWithoutCids = getAccountsCommentsWithoutCids()[(_a = comment === null || comment === void 0 ? void 0 : comment.author) === null || _a === void 0 ? void 0 : _a.address];
    if (!accountCommentsWithoutCids) {
        return;
    }
    for (const accountComment of accountCommentsWithoutCids) {
        // if author address and timestamp is the same, we assume it's the right comment
        if (accountComment.timestamp && accountComment.timestamp === comment.timestamp) {
            const commentWithCid = utils.merge(accountComment, comment);
            yield accountsDatabase.addAccountComment(accountComment.accountId, commentWithCid, accountComment.index);
            log("accountsActions.addCidToAccountComment", {
                commentCid: comment.cid,
                accountCommentIndex: accountComment.index,
                accountComment: commentWithCid,
            });
            accountsStore.setState(({ accountsComments, commentCidsToAccountsComments }) => {
                const updatedAccountComments = [...accountsComments[accountComment.accountId]];
                updatedAccountComments[accountComment.index] = commentWithCid;
                const newAccountsComments = Object.assign(Object.assign({}, accountsComments), { [accountComment.accountId]: updatedAccountComments });
                return {
                    accountsComments: newAccountsComments,
                    commentCidsToAccountsComments: Object.assign(Object.assign({}, commentCidsToAccountsComments), { [comment.cid]: {
                            accountId: accountComment.accountId,
                            accountCommentIndex: accountComment.index,
                        } }),
                };
            });
            startUpdatingAccountCommentOnCommentUpdateEvents(comment, accounts[accountComment.accountId], accountComment.index).catch((error) => log.error("accountsActions.addCidToAccountComment startUpdatingAccountCommentOnCommentUpdateEvents error", {
                comment,
                account: accounts[accountComment.accountId],
                accountCommentIndex: accountComment.index,
                error,
            }));
            break;
        }
    }
});
// cache the last result of this function
let previousAccountsCommentsJson;
let previousAccountsCommentsWithoutCids = {};
const getAccountsCommentsWithoutCids = () => {
    var _a;
    const { accounts, accountsComments } = accountsStore.getState();
    // same accounts comments as last time, return cached value
    const accountsCommentsJson = JSON.stringify(accountsComments);
    if (accountsCommentsJson === previousAccountsCommentsJson) {
        return previousAccountsCommentsWithoutCids;
    }
    previousAccountsCommentsJson = accountsCommentsJson;
    const accountsCommentsWithoutCids = {};
    if (!accounts || !accountsComments) {
        return accountsCommentsWithoutCids;
    }
    for (const accountId in accountsComments) {
        const accountComments = accountsComments[accountId];
        const account = accounts[accountId];
        for (const accountCommentIndex in accountComments) {
            const accountComment = accountComments[accountCommentIndex];
            if (!accountComment.cid) {
                const authorAddress = (_a = account === null || account === void 0 ? void 0 : account.author) === null || _a === void 0 ? void 0 : _a.address;
                if (!authorAddress) {
                    continue;
                }
                if (!accountsCommentsWithoutCids[authorAddress]) {
                    accountsCommentsWithoutCids[authorAddress] = [];
                }
                accountsCommentsWithoutCids[authorAddress].push(accountComment);
            }
        }
    }
    previousAccountsCommentsWithoutCids = accountsCommentsWithoutCids;
    return accountsCommentsWithoutCids;
};
// internal accounts action: mark an account's notifications as read
export const markNotificationsAsRead = (account) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountsCommentsReplies } = accountsStore.getState();
    assert(typeof (account === null || account === void 0 ? void 0 : account.id) === "string", `accountsStore.markNotificationsAsRead invalid account argument '${account}'`);
    // find all unread replies
    const repliesToMarkAsRead = {};
    for (const replyCid in accountsCommentsReplies[account.id]) {
        if (!accountsCommentsReplies[account.id][replyCid].markedAsRead) {
            repliesToMarkAsRead[replyCid] = Object.assign(Object.assign({}, accountsCommentsReplies[account.id][replyCid]), { markedAsRead: true });
        }
    }
    // add all to database
    const promises = [];
    for (const replyCid in repliesToMarkAsRead) {
        promises.push(accountsDatabase.addAccountCommentReply(account.id, repliesToMarkAsRead[replyCid]));
    }
    yield Promise.all(promises);
    // add all to react store
    log("accountsActions.markNotificationsAsRead", { account, repliesToMarkAsRead });
    accountsStore.setState(({ accountsCommentsReplies }) => {
        const updatedAccountCommentsReplies = Object.assign(Object.assign({}, accountsCommentsReplies[account.id]), repliesToMarkAsRead);
        return {
            accountsCommentsReplies: Object.assign(Object.assign({}, accountsCommentsReplies), { [account.id]: updatedAccountCommentsReplies }),
        };
    });
});
// internal accounts action: if a community has a role with an account's address
// add it to the account.communities database
export const addCommunityRoleToAccountsCommunities = (community) => __awaiter(void 0, void 0, void 0, function* () {
    if (!community) {
        return;
    }
    const { accounts } = accountsStore.getState();
    assert(accounts, `can't use accountsStore.accountActions before initialized`);
    // find community roles to add and remove
    const getRole = (community, authorAddress) => community.roles && community.roles[authorAddress];
    const getChange = (accounts, community) => {
        var _a;
        const toUpsert = [];
        const toRemove = [];
        for (const accountId in accounts) {
            const account = accounts[accountId];
            const role = getRole(community, account.author.address);
            if (!role) {
                if (account.communities[community.address]) {
                    toRemove.push(accountId);
                }
            }
            else {
                const currentRole = (_a = account.communities[community.address]) === null || _a === void 0 ? void 0 : _a.role;
                if (!currentRole || currentRole.role !== role.role) {
                    toUpsert.push(accountId);
                }
            }
        }
        return {
            toUpsert,
            toRemove,
            hasChange: toUpsert.length !== 0 || toRemove.length !== 0,
        };
    };
    const { hasChange } = getChange(accounts, community);
    if (!hasChange) {
        return;
    }
    accountsStore.setState(({ accounts }) => {
        const { toUpsert, toRemove } = getChange(accounts, community);
        const nextAccounts = Object.assign({}, accounts);
        // edit databases and build next accounts (toUpsert implies role exists from getChange)
        for (const accountId of toUpsert) {
            const account = Object.assign({}, nextAccounts[accountId]);
            const role = community.roles[account.author.address];
            account.communities = Object.assign(Object.assign({}, account.communities), { [community.address]: Object.assign(Object.assign({}, account.communities[community.address]), { role }) });
            nextAccounts[accountId] = account;
            accountsDatabase.addAccount(account);
        }
        for (const accountId of toRemove) {
            const account = Object.assign({}, nextAccounts[accountId]);
            account.communities = Object.assign({}, account.communities);
            delete account.communities[community.address];
            nextAccounts[accountId] = account;
            accountsDatabase.addAccount(account);
        }
        log("accountsActions.addCommunityRoleToAccountsCommunities", {
            community,
            toUpsert,
            toRemove,
        });
        return { accounts: nextAccounts };
    });
});
