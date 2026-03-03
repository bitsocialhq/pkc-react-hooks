import { waitFor as tlWaitFor, renderHook, act as tlAct } from "@testing-library/react";
import { resetCommentsStore, resetCommentsDatabaseAndStore } from "../stores/comments";
import { resetSubplebbitsStore, resetSubplebbitsDatabaseAndStore } from "../stores/subplebbits";
import { resetAccountsStore, resetAccountsDatabaseAndStore } from "../stores/accounts";
import { resetFeedsStore, resetFeedsDatabaseAndStore } from "../stores/feeds";
import {
  resetSubplebbitsPagesStore,
  resetSubplebbitsPagesDatabaseAndStore,
} from "../stores/subplebbits-pages";
import {
  resetAuthorsCommentsStore,
  resetAuthorsCommentsDatabaseAndStore,
} from "../stores/authors-comments";
import { resetRepliesStore, resetRepliesDatabaseAndStore } from "../stores/replies";
import { resetRepliesPagesStore, resetRepliesPagesDatabaseAndStore } from "../stores/replies-pages";
import localForageLru from "./localforage-lru";
import localForage from "localforage";

const restorables: any = [];

export const silenceUpdateUnmountedComponentWarning = () => {
  const originalError = console.error;
  console.error = (...args) => {
    if (/Can't perform a React state update on an unmounted component/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
  const restore = () => {
    console.error = originalError;
  };
  restorables.push(restore);
  return restore;
};

export const silenceTestWasNotWrappedInActWarning = () => {
  const originalError = console.error;
  console.error = (...args) => {
    if (/inside a test was not wrapped in act/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
  const restore = () => {
    console.error = originalError;
  };
  restorables.push(restore);
  return restore;
};

// this warning is usually good to have, so don't include it in silenceReactWarnings
export const silenceOverlappingActWarning = () => {
  const originalError = console.error;
  console.error = (...args) => {
    if (/overlapping act\(\) calls/.test(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
  const restore = () => {
    console.error = originalError;
  };
  restorables.push(restore);
  return restore;
};

export const silenceReactWarnings = () => {
  silenceUpdateUnmountedComponentWarning();
  silenceTestWasNotWrappedInActWarning();
};

const restoreAll = () => {
  for (const restore of restorables) {
    restore();
  }
};

type WaitForOptions = {
  timeout?: number;
  interval?: number;
};
const createWaitFor = (rendered: any, waitForOptions?: WaitForOptions) => {
  if (!rendered?.result) {
    throw Error(`createWaitFor invalid 'rendered' argument`);
  }
  const waitFor = async (waitForFunction: Function) => {
    const stackTraceLimit = Error.stackTraceLimit;
    Error.stackTraceLimit = 10;
    const errorWithUsefulStackTrace = new Error("waitFor");
    Error.stackTraceLimit = stackTraceLimit;

    if (typeof waitForFunction !== "function") {
      throw Error(`waitFor invalid 'waitForFunction' argument`);
    }
    // @ts-ignore
    if (typeof waitForFunction.then === "function") {
      throw Error(`waitFor 'waitForFunction' can't be async`);
    }
    const { timeout = 2000, interval = 50 } = waitForOptions || {};
    const start = Date.now();
    while (true) {
      // flush pending React/Zustand state updates before each check
      await tlAct(async () => {});
      try {
        if (Boolean(waitForFunction())) return;
      } catch (e) {
        // condition threw (e.g. accessing property on undefined), keep waiting
      }
      if (Date.now() - start >= timeout) {
        errorWithUsefulStackTrace.message = `Timed out in waitFor after ${timeout}ms. ${waitForFunction.toString()}`;
        if (!testUtils.silenceWaitForWarning) {
          console.warn(errorWithUsefulStackTrace);
        }
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  };
  return waitFor;
};

// always reset the least important store first, because a store even can affect another store
export const resetStores = async () => {
  await resetRepliesPagesStore();
  await resetRepliesStore();
  await resetAuthorsCommentsStore();
  await resetSubplebbitsPagesStore();
  await resetFeedsStore();
  await resetSubplebbitsStore();
  await resetCommentsStore();
  // always accounts last because it has async initialization
  await resetAccountsStore();
};

export const resetDatabasesAndStores = async () => {
  await resetRepliesPagesDatabaseAndStore();
  await resetRepliesDatabaseAndStore();
  await resetAuthorsCommentsDatabaseAndStore();
  await resetSubplebbitsPagesDatabaseAndStore();
  await resetFeedsDatabaseAndStore();
  await resetSubplebbitsDatabaseAndStore();
  await resetCommentsDatabaseAndStore();
  // always accounts last because it has async initialization
  await resetAccountsDatabaseAndStore();
};

// renderHook wrapper that tracks all intermediate render results in result.all
// (replaces @testing-library/react-hooks' result.all which doesn't exist in @testing-library/react)
const renderHookWithHistory = <Result, Props>(
  callback: (props: Props) => Result,
  options?: any,
) => {
  const allResults: Result[] = [];
  const rendered = renderHook<Result, Props>((props) => {
    const value = callback(props);
    allResults.push(value);
    return value;
  }, options);
  // Use Proxy because result.result may be frozen in React 19
  const resultWithAll = new Proxy(rendered.result, {
    get(target, prop) {
      if (prop === "all") return allResults;
      return (target as any)[prop];
    },
  });
  return { ...rendered, result: resultWithAll };
};

const testUtils = {
  silenceTestWasNotWrappedInActWarning,
  silenceUpdateUnmountedComponentWarning,
  silenceOverlappingActWarning,
  silenceReactWarnings,
  restoreAll,
  resetStores,
  resetDatabasesAndStores,
  createWaitFor,
  renderHookWithHistory,
  // can be useful to silence warnings in tests that use retry
  silenceWaitForWarning: false,
};

export default testUtils;
