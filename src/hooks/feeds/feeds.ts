import { useEffect, useMemo, useState } from "react";
import { useAccount } from "../accounts";
import validator from "../../lib/validator";
import Logger from "@pkc/pkc-logger";
const log = Logger("bitsocial-react-hooks:feeds:hooks");
import assert from "assert";
import {
  Feed,
  Feeds,
  UseBufferedFeedsOptions,
  UseBufferedFeedsResult,
  UseFeedOptions,
  UseFeedResult,
  CommentsFilter,
} from "../../types";
import useFeedsStore from "../../stores/feeds";
import { addCommentModerationToComments } from "../../lib/utils/comment-moderation";
import shallow from "zustand/shallow";
import {
  CommunityLookupRef,
  getCommunityRefKeys,
  getUniqueSortedCommunityRefs,
} from "../../lib/community-ref";

/**
 * @param communities - The communities to fetch, e.g. [{name: 'memes.eth'}, {publicKey: '12D3KooW...'}]
 * @param sortType - The sorting algo for the feed: 'hot' | 'new' | 'active' | 'topHour' | 'topDay' | 'topWeek' | 'topMonth' | 'topYear' | 'topAll' | 'controversialHour' | 'controversialDay' | 'controversialWeek' | 'controversialMonth' | 'controversialYear' | 'controversialAll'
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useFeed(options?: UseFeedOptions): UseFeedResult {
  assert(
    !options || typeof options === "object",
    `useFeed options argument '${options}' not an object`,
  );
  const opts = options || {};
  let {
    communities,
    sortType,
    accountName,
    postsPerPage,
    filter,
    newerThan,
    accountComments,
    modQueue,
  } = opts;
  sortType = getSortType(sortType, newerThan);

  validator.validateUseFeedArguments({
    communities,
    communityRefs: (opts as any).communityRefs,
    communityAddresses: (opts as any).communityAddresses,
    sortType,
    accountName,
    postsPerPage,
    filter,
    newerThan,
    accountComments,
  });
  const account = useAccount({ accountName });
  const addFeedToStore = useFeedsStore((state) => state.addFeedToStore);
  const incrementFeedPageNumber = useFeedsStore((state) => state.incrementFeedPageNumber);
  const resetFeed = useFeedsStore((state) => state.resetFeed);
  const normalizedCommunityRefs = useMemo(() => communities || [], [communities]);
  const uniqueCommunityRefs = useUniqueSortedCommunityRefs(normalizedCommunityRefs);
  const uniqueCommunityKeys = useMemo(
    () => getCommunityRefKeys(uniqueCommunityRefs),
    [uniqueCommunityRefs],
  );
  const feedName = useFeedName(
    account?.id,
    sortType,
    uniqueCommunityKeys,
    postsPerPage,
    filter,
    newerThan,
    accountComments,
    modQueue,
  );
  const [errors, setErrors] = useState<Error[]>([]);
  const communityKeysWithNewerPosts = useFeedsStore(
    (state) => state.feedsCommunityKeysWithNewerPosts[feedName],
  );

  // add feed to store
  useEffect(() => {
    if (!uniqueCommunityRefs.length || !account) {
      return;
    }
    const isBufferedFeed = false;
    addFeedToStore(
      feedName,
      uniqueCommunityRefs,
      uniqueCommunityKeys,
      sortType,
      account,
      isBufferedFeed,
      postsPerPage,
      filter,
      newerThan,
      accountComments,
      modQueue,
    ).catch((error: unknown) => log.error("useFeed addFeedToStore error", { feedName, error }));
  }, [feedName]);

  const feedKey = feedName ?? "";
  const feed = useFeedsStore((state) => state.loadedFeeds[feedKey]);
  const updatedFeed = useFeedsStore((state) => state.updatedFeeds[feedKey]);
  const bufferedFeed = useFeedsStore((state) => state.bufferedFeeds[feedKey]);
  let hasMore = useFeedsStore((state) => state.feedsHaveMore[feedKey]);
  if (!feedName || typeof hasMore !== "boolean") {
    hasMore = true;
  }
  if (!normalizedCommunityRefs.length) {
    hasMore = false;
  }

  const loadMore = async () => {
    try {
      if (!uniqueCommunityRefs.length || !account) {
        throw Error("useFeed cannot load more feed not initalized yet");
      }
      incrementFeedPageNumber(feedName);
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50));
      setErrors([...errors, e]);
    }
  };

  const reset = async () => {
    try {
      if (!uniqueCommunityRefs.length || !account) {
        throw Error("useFeed cannot reset feed not initalized yet");
      }
      await resetFeed(feedName);
    } catch (e: any) {
      // wait 100 ms so infinite scroll doesn't spam this function
      await new Promise((r) => setTimeout(r, 50));
      setErrors([...errors, e]);
    }
  };

  if (account && normalizedCommunityRefs.length) {
    log("useFeed", {
      feedLength: feed?.length || 0,
      hasMore,
      communities: normalizedCommunityRefs,
      communityKeys: uniqueCommunityKeys,
      sortType,
      account,
      feedsStoreOptions: useFeedsStore.getState().feedsOptions,
      feedsStore: useFeedsStore.getState(),
    });
  }

  const state = !hasMore ? "succeeded" : "fetching-ipns";
  const normalizedFeed = useMemo(() => addCommentModerationToComments(feed), [feed]);
  const normalizedBufferedFeed = useMemo(
    () => addCommentModerationToComments(bufferedFeed),
    [bufferedFeed],
  );
  const normalizedUpdatedFeed = useMemo(
    () => addCommentModerationToComments(updatedFeed),
    [updatedFeed],
  );

  return useMemo(
    () => ({
      feed: normalizedFeed,
      bufferedFeed: normalizedBufferedFeed,
      updatedFeed: normalizedUpdatedFeed,
      hasMore,
      communityKeysWithNewerPosts: communityKeysWithNewerPosts || [],
      loadMore,
      reset,
      state,
      error: errors[errors.length - 1],
      errors,
    }),
    [
      normalizedFeed,
      normalizedBufferedFeed,
      normalizedUpdatedFeed,
      feedName,
      hasMore,
      errors,
      communityKeysWithNewerPosts,
    ],
  );
}

/**
 * Use useBufferedFeeds to buffer multiple feeds in the background so what when
 * they are called by useFeed later, they are already preloaded.
 *
 * @param feedOptions - The options of the feed
 * @param acountName - The nickname of the account, e.g. 'Account 1'. If no accountName is provided, use
 * the active account.
 */
export function useBufferedFeeds(options?: UseBufferedFeedsOptions): UseBufferedFeedsResult {
  assert(
    !options || typeof options === "object",
    `useBufferedFeeds options argument '${options}' not an object`,
  );
  const opts = options ?? {};
  const { feedsOptions = [], accountName } = opts;
  validator.validateUseBufferedFeedsArguments({ feedsOptions, accountName });
  const account = useAccount({ accountName });
  const addFeedToStore = useFeedsStore((state) => state.addFeedToStore);

  // do a bunch of calculations to get feedsOptionsFlattened and feedNames
  const feedsOpts = feedsOptions;
  const {
    communityRefsArrays,
    communityKeysArrays,
    sortTypes,
    postsPerPages,
    filters,
    newerThans,
  } = useMemo(() => {
    const communityRefsArrays = [];
    const communityKeysArrays = [];
    const sortTypes = [];
    const postsPerPages = [];
    const filters = [];
    const newerThans = [];
    for (const feedOptions of feedsOpts) {
      validator.validateUseFeedArguments({
        communities: feedOptions.communities,
        communityRefs: (feedOptions as any).communityRefs,
        communityAddresses: (feedOptions as any).communityAddresses,
        sortType: getSortType(feedOptions.sortType, feedOptions.newerThan),
        accountName,
        postsPerPage: feedOptions.postsPerPage,
        filter: feedOptions.filter,
        newerThan: feedOptions.newerThan,
        accountComments: feedOptions.accountComments,
      });
      const normalizedCommunityRefs = getUniqueSortedCommunityRefs(feedOptions.communities || []);
      communityRefsArrays.push(normalizedCommunityRefs);
      communityKeysArrays.push(getCommunityRefKeys(normalizedCommunityRefs));
      sortTypes.push(getSortType(feedOptions.sortType, feedOptions.newerThan));
      postsPerPages.push(feedOptions.postsPerPage);
      filters.push(feedOptions.filter);
      newerThans.push(feedOptions.newerThan);
    }
    return {
      communityRefsArrays,
      communityKeysArrays,
      sortTypes,
      postsPerPages,
      filters,
      newerThans,
    };
  }, [feedsOpts]);
  const feedNames = useFeedNames(
    account?.id,
    sortTypes,
    communityKeysArrays,
    postsPerPages,
    filters,
    newerThans,
  );

  const bufferedFeeds = useFeedsStore((state) => {
    const bufferedFeeds: Feeds = {};
    for (const feedName of feedNames) {
      bufferedFeeds[feedName] = state.bufferedFeeds[feedName];
    }
    return bufferedFeeds;
  }, shallow);

  // add feed to store
  useEffect(() => {
    for (const [i] of communityRefsArrays.entries()) {
      const sortType = sortTypes[i] ?? "hot";
      const uniqueCommunityRefs = communityRefsArrays[i];
      const uniqueCommunityKeys = communityKeysArrays[i];
      validator.validateFeedSortType(sortType);
      const feedName = feedNames[i];
      if (!uniqueCommunityRefs || !account) {
        return;
      }
      const fkey = feedName ?? "";
      if (!bufferedFeeds[fkey]) {
        const isBufferedFeed = true;
        addFeedToStore(
          feedName,
          uniqueCommunityRefs,
          uniqueCommunityKeys,
          sortType,
          account,
          isBufferedFeed,
        ).catch((error: unknown) =>
          log.error("useBufferedFeeds addFeedToStore error", { feedName, error }),
        );
      }
    }
  }, [feedNames]);

  // only give to the user the buffered feeds he requested
  const bufferedFeedsArray: Feed[] = useMemo(() => {
    const bufferedFeedsArray: Feed[] = [];
    for (const feedName of feedNames) {
      const key = feedName ?? "";
      bufferedFeedsArray.push(addCommentModerationToComments(bufferedFeeds[key]));
    }
    return bufferedFeedsArray;
  }, [bufferedFeeds, feedNames]);

  if (account && feedsOptions?.length) {
    log("useBufferedFeeds", {
      bufferedFeeds,
      feedsOptions,
      account,
      accountName,
      feedsStoreOptions: useFeedsStore.getState().feedsOptions,
      feedsStore: useFeedsStore.getState(),
    });
  }

  const state = "fetching-ipns";

  return useMemo(
    () => ({
      bufferedFeeds: bufferedFeedsArray,
      state,
      error: undefined,
      errors: [],
    }),
    [bufferedFeedsArray, feedsOptions],
  );
}

function useUniqueSortedCommunityRefs(communityRefs?: CommunityLookupRef[]) {
  return useMemo(() => {
    return getUniqueSortedCommunityRefs(communityRefs);
  }, [communityRefs]);
}

function useFeedName(
  accountId: string,
  sortType: string,
  uniqueCommunityKeys: string[],
  postsPerPage?: number,
  filter?: CommentsFilter,
  newerThan?: number,
  accountComments?: UseFeedOptions["accountComments"],
  modQueue?: string[],
) {
  const filterKey = filter?.key;
  const accountCommentsNewerThan = accountComments?.newerThan;
  const accountCommentsAppend = accountComments?.append;
  return useMemo(() => {
    return (
      accountId +
      "-" +
      sortType +
      "-" +
      uniqueCommunityKeys +
      "-" +
      postsPerPage +
      "-" +
      filterKey +
      "-" +
      newerThan +
      "-" +
      accountCommentsNewerThan +
      "-" +
      accountCommentsAppend +
      "-" +
      modQueue
    );
  }, [
    accountId,
    sortType,
    uniqueCommunityKeys,
    postsPerPage,
    filterKey,
    newerThan,
    accountCommentsNewerThan,
    accountCommentsAppend,
    modQueue?.toString(),
  ]);
}

function useFeedNames(
  accountId: string,
  sortTypes: (string | undefined)[],
  uniqueCommunityKeysArrays: string[][],
  postsPerPages: (number | undefined)[],
  filters: (CommentsFilter | undefined)[],
  newerThans: (number | undefined)[],
) {
  return useMemo(() => {
    const feedNames = [];
    for (const [i] of sortTypes.entries()) {
      feedNames.push(
        accountId +
          "-" +
          (sortTypes[i] ?? "hot") +
          "-" +
          uniqueCommunityKeysArrays[i] +
          "-" +
          postsPerPages[i] +
          "-" +
          filters[i]?.key +
          "-" +
          newerThans[i],
      );
    }
    return feedNames;
  }, [accountId, sortTypes, uniqueCommunityKeysArrays, postsPerPages, filters, newerThans]);
}

const NEWER_THAN_LIMITS = [
  [60 * 60 * 24, "Day"],
  [60 * 60 * 24 * 7, "Week"],
  [60 * 60 * 24 * 31, "Month"],
  [60 * 60 * 24 * 365, "Year"],
] as const;

const getSortType = (sortType?: string, newerThan?: number): string => {
  const base = sortType || "hot";
  if (!newerThan || (base !== "topAll" && base !== "controversialAll")) return base;
  let time: string | undefined;
  for (const [limit, name] of NEWER_THAN_LIMITS) {
    if (newerThan <= limit) {
      time = name;
      break;
    }
  }
  if (!time) return base;
  return base === "topAll" ? `top${time}` : `controversial${time}`;
};
