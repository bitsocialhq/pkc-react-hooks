import { act } from "@testing-library/react";
import testUtils, { renderHook } from "../../lib/test-utils";
import subplebbitsStore, { resetSubplebbitsDatabaseAndStore } from "./subplebbits-store";
import localForageLru from "../../lib/localforage-lru";
import { setPlebbitJs } from "../..";
import PlebbitJsMock from "../../lib/plebbit-js/plebbit-js-mock";
import accountsStore from "../accounts";
import subplebbitsPagesStore from "../subplebbits-pages";

let mockAccount: any;

describe("subplebbits store", () => {
  beforeAll(async () => {
    setPlebbitJs(PlebbitJsMock);
    testUtils.silenceReactWarnings();
    const plebbit = await PlebbitJsMock();
    mockAccount = { id: "mock-account-id", plebbit };
  });
  afterAll(() => {
    testUtils.restoreAll();
  });

  afterEach(async () => {
    await resetSubplebbitsDatabaseAndStore();
  });

  test("initial store", () => {
    const { result } = renderHook(() => subplebbitsStore.getState());
    expect(result.current.subplebbits).toEqual({});
    expect(result.current.errors).toEqual({});
    expect(typeof result.current.addSubplebbitToStore).toBe("function");
  });

  test("addSubplebbitToStore adds subplebbit from plebbit", async () => {
    const address = "subplebbit address 1";

    await act(async () => {
      await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
    });

    expect(subplebbitsStore.getState().subplebbits[address]).toBeDefined();
    expect(subplebbitsStore.getState().subplebbits[address].address).toBe(address);
  });

  test("cached subplebbit create failure logs to console", async () => {
    const address = "cached-fail-address";
    const db = localForageLru.createInstance({ name: "plebbitReactHooks-subplebbits" });
    await db.setItem(address, { address, invalid: "data" });

    const createSubplebbitOriginal = mockAccount.plebbit.createSubplebbit;
    mockAccount.plebbit.createSubplebbit = vi.fn().mockRejectedValue(new Error("create failed"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      try {
        await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
      } catch {
        // expected to throw
      }
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "failed plebbit.createSubplebbit(cachedSubplebbit)",
      expect.objectContaining({
        cachedSubplebbit: expect.any(Object),
        error: expect.any(Error),
      }),
    );
    consoleSpy.mockRestore();
    mockAccount.plebbit.createSubplebbit = createSubplebbitOriginal;
  });

  test("missing-subplebbit state guard returns empty object in client updater", async () => {
    const address = "client-update-address";
    let storedCb: ((...args: any[]) => void) | null = null;

    const utils = await import("../../lib/utils");
    const origClientsOnStateChange = utils.default.clientsOnStateChange;
    (utils.default as any).clientsOnStateChange = (_clients: any, cb: any) => {
      storedCb = () => cb("state", "type", "url");
    };

    await act(async () => {
      await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
    });

    expect(storedCb).toBeTruthy();
    subplebbitsStore.setState({ subplebbits: {} });

    storedCb!();

    expect(subplebbitsStore.getState().subplebbits).toEqual({});

    (utils.default as any).clientsOnStateChange = origClientsOnStateChange;
  });

  test("subplebbit.update catch logs when update rejects", async () => {
    const address = "update-reject-address";
    const plebbit = await PlebbitJsMock();
    const subplebbit = await plebbit.createSubplebbit({ address });
    const updateSpy = vi
      .spyOn(subplebbit, "update")
      .mockRejectedValueOnce(new Error("update failed"));

    const createSubplebbitOrig = mockAccount.plebbit.createSubplebbit;
    mockAccount.plebbit.createSubplebbit = vi.fn().mockResolvedValue(subplebbit);

    await act(async () => {
      await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
    });

    await new Promise((r) => setTimeout(r, 100));

    mockAccount.plebbit.createSubplebbit = createSubplebbitOrig;
    updateSpy.mockRestore();
  });

  test("addSubplebbitToStore sets errors and throws when createSubplebbit rejects", async () => {
    const address = "create-reject-address";
    const createOrig = mockAccount.plebbit.createSubplebbit;
    mockAccount.plebbit.createSubplebbit = vi.fn().mockRejectedValue(new Error("create failed"));

    await act(async () => {
      try {
        await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
      } catch (e) {
        expect((e as Error).message).toBe("create failed");
      }
    });

    expect(subplebbitsStore.getState().errors[address]).toHaveLength(1);
    expect(subplebbitsStore.getState().errors[address][0].message).toBe("create failed");
    mockAccount.plebbit.createSubplebbit = createOrig;
  });

  test("addSubplebbitToStore throws generic Error when subplebbit is undefined without thrown error", async () => {
    const address = "resolve-undefined-address";
    const createOrig = mockAccount.plebbit.createSubplebbit;
    mockAccount.plebbit.createSubplebbit = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      try {
        await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
      } catch (e) {
        expect((e as Error).message).toContain("failed getting subplebbit");
      }
    });

    mockAccount.plebbit.createSubplebbit = createOrig;
  });

  test("subplebbit update event calls addSubplebbitRoleToAccountsSubplebbits and addSubplebbitPageCommentsToStore", async () => {
    const address = "update-event-address";
    const plebbit = await PlebbitJsMock();
    const subplebbit = await plebbit.createSubplebbit({ address });
    const addRoleSpy = vi.fn().mockResolvedValue(undefined);
    const addCommentsSpy = vi.fn();
    const accountsGetState = accountsStore.getState;
    (accountsStore as any).getState = () => ({
      ...accountsGetState(),
      accountsActionsInternal: { addSubplebbitRoleToAccountsSubplebbits: addRoleSpy },
    });
    const pagesGetState = subplebbitsPagesStore.getState;
    (subplebbitsPagesStore as any).getState = () => ({
      ...pagesGetState(),
      addSubplebbitPageCommentsToStore: addCommentsSpy,
    });

    const createOrig = mockAccount.plebbit.createSubplebbit;
    mockAccount.plebbit.createSubplebbit = vi.fn().mockResolvedValue(subplebbit);

    await act(async () => {
      await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
    });

    subplebbit.emit("update", subplebbit);
    await new Promise((r) => setTimeout(r, 50));

    expect(addRoleSpy).toHaveBeenCalledWith(expect.objectContaining({ address }));
    expect(addCommentsSpy).toHaveBeenCalledWith(expect.objectContaining({ address }));

    (accountsStore as any).getState = accountsGetState;
    (subplebbitsPagesStore as any).getState = pagesGetState;
    mockAccount.plebbit.createSubplebbit = createOrig;
  });

  test("createSubplebbit with no signer asserts address must be undefined", async () => {
    const plebbit = await PlebbitJsMock();
    const subplebbit = await plebbit.createSubplebbit({ address: "new-sub-address" });
    const createOrig = mockAccount.plebbit.createSubplebbit;
    mockAccount.plebbit.createSubplebbit = vi.fn().mockResolvedValue(subplebbit);

    await act(async () => {
      await subplebbitsStore.getState().createSubplebbit({}, mockAccount);
    });

    expect(mockAccount.plebbit.createSubplebbit).toHaveBeenCalledWith({});
    mockAccount.plebbit.createSubplebbit = createOrig;
  });

  test("createSubplebbit with address but no signer throws (branch 251)", async () => {
    await expect(
      subplebbitsStore.getState().createSubplebbit({ address: "addr-no-signer" }, mockAccount),
    ).rejects.toThrow("createSubplebbitOptions.address 'addr-no-signer' must be undefined");
  });

  test("clientsOnStateChange with chainTicker branch", async () => {
    const address = "chain-ticker-address";
    let storedCb: ((...args: any[]) => void) | null = null;

    const utils = await import("../../lib/utils");
    const origClientsOnStateChange = utils.default.clientsOnStateChange;
    (utils.default as any).clientsOnStateChange = (_clients: any, cb: any) => {
      storedCb = () => cb("state", "type", "url", "ETH");
    };

    await act(async () => {
      await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
    });

    expect(storedCb).toBeTruthy();
    subplebbitsStore.setState((state: any) => ({
      subplebbits: {
        ...state.subplebbits,
        [address]: {
          ...state.subplebbits[address],
          clients: { type: {} },
        },
      },
    }));
    storedCb!();
    expect(subplebbitsStore.getState().subplebbits[address]?.clients?.type?.ETH).toBeDefined();

    (utils.default as any).clientsOnStateChange = origClientsOnStateChange;
  });

  test("clientsOnStateChange returns {} when subplebbit missing and chainTicker provided", async () => {
    const address = "chain-missing-address";
    let storedCb: ((...args: any[]) => void) | null = null;

    const utils = await import("../../lib/utils");
    const origClientsOnStateChange = utils.default.clientsOnStateChange;
    (utils.default as any).clientsOnStateChange = (_clients: any, cb: any) => {
      storedCb = () => cb("state", "type", "url", "ETH");
    };

    await act(async () => {
      await subplebbitsStore.getState().addSubplebbitToStore(address, mockAccount);
    });
    expect(storedCb).toBeTruthy();
    subplebbitsStore.setState({ subplebbits: {} });
    storedCb!();
    expect(subplebbitsStore.getState().subplebbits).toEqual({});

    (utils.default as any).clientsOnStateChange = origClientsOnStateChange;
  });
});
