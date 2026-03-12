import { Feeds, FeedsOptions, FeedsCommunitiesPostCounts } from "../../types";
export declare const defaultPostsPerPage = 25;
type FeedsState = {
    feedsOptions: FeedsOptions;
    bufferedFeeds: Feeds;
    loadedFeeds: Feeds;
    updatedFeeds: Feeds;
    bufferedFeedsCommunitiesPostCounts: FeedsCommunitiesPostCounts;
    feedsHaveMore: {
        [feedName: string]: boolean;
    };
    feedsCommunityAddressesWithNewerPosts: {
        [feedName: string]: string[];
    };
    addFeedToStore: Function;
    incrementFeedPageNumber: Function;
    resetFeed: Function;
    updateFeeds: Function;
};
declare const feedsStore: import("zustand").UseBoundStore<import("zustand").StoreApi<FeedsState>>;
export declare const resetFeedsStore: () => Promise<void>;
export declare const resetFeedsDatabaseAndStore: () => Promise<void>;
export default feedsStore;
