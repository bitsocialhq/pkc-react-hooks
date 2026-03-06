import accountGenerator, { getDefaultPlebbitOptions } from "./account-generator";
import { setPlebbitJs, restorePlebbitJs } from "../../lib/plebbit-js";
import PlebbitJsMock from "../../lib/plebbit-js/plebbit-js-mock";
import accountsDatabase from "./accounts-database";

describe("account-generator", () => {
  beforeAll(() => setPlebbitJs(PlebbitJsMock));
  afterAll(() => restorePlebbitJs());

  describe("getDefaultPlebbitOptions", () => {
    test("returns web defaults when window.defaultPlebbitOptions is absent", () => {
      const orig = (global as any).window?.defaultPlebbitOptions;
      delete (global as any).window?.defaultPlebbitOptions;
      try {
        const opts = getDefaultPlebbitOptions();
        expect(opts.ipfsGatewayUrls).toBeDefined();
        expect(opts.chainProviders).toBeDefined();
        expect(opts.chainProviders.eth).toBeDefined();
        expect(opts.chainProviders.matic).toBeDefined();
        expect(opts.chainProviders.sol).toBeDefined();
        expect(opts.resolveAuthorAddresses).toBe(false);
        expect(opts.validatePages).toBe(false);
      } finally {
        if (orig !== undefined) (global as any).window.defaultPlebbitOptions = orig;
      }
    });

    test("uses window.defaultPlebbitOptions when present", () => {
      const custom = {
        ipfsGatewayUrls: ["https://custom.ipfs.io"],
        chainProviders: { eth: { urls: ["custom"], chainId: 1 } },
      };
      (global as any).window = (global as any).window || {};
      (global as any).window.defaultPlebbitOptions = custom;
      try {
        const opts = getDefaultPlebbitOptions();
        expect(opts.ipfsGatewayUrls).toEqual(["https://custom.ipfs.io"]);
        expect(opts.chainProviders.eth.urls).toEqual(["custom"]);
      } finally {
        delete (global as any).window.defaultPlebbitOptions;
      }
    });

    test("injects missing chain providers from defaults", () => {
      const custom = {
        ipfsGatewayUrls: ["https://custom.ipfs.io"],
        chainProviders: { eth: { urls: ["custom"], chainId: 1 } },
      };
      (global as any).window = (global as any).window || {};
      (global as any).window.defaultPlebbitOptions = custom;
      try {
        const opts = getDefaultPlebbitOptions();
        expect(opts.chainProviders.matic).toBeDefined();
        expect(opts.chainProviders.sol).toBeDefined();
      } finally {
        delete (global as any).window.defaultPlebbitOptions;
      }
    });

    test("preserves libp2pJsClientsOptions from window defaults", () => {
      const libp2pOpts = { some: "non-json" };
      const custom = {
        ipfsGatewayUrls: ["https://custom.ipfs.io"],
        libp2pJsClientsOptions: libp2pOpts,
      };
      (global as any).window = (global as any).window || {};
      (global as any).window.defaultPlebbitOptions = custom;
      try {
        const opts = getDefaultPlebbitOptions();
        expect(opts.libp2pJsClientsOptions).toBe(libp2pOpts);
      } finally {
        delete (global as any).window.defaultPlebbitOptions;
      }
    });
  });

  describe("generateDefaultAccount", () => {
    beforeEach(async () => {
      await accountsDatabase.accountsMetadataDatabase.clear();
      await accountsDatabase.accountsDatabase.clear();
    });

    test("creates account with plebbit, signer, author, wallets", async () => {
      const account = await accountGenerator.generateDefaultAccount();
      expect(account.id).toBeDefined();
      expect(account.name).toBe("Account 1");
      expect(account.author.address).toBeDefined();
      expect(account.signer).toBeDefined();
      expect(account.plebbit).toBeDefined();
      expect(account.plebbitOptions).toBeDefined();
      expect(account.version).toBe(accountsDatabase.accountVersion);
    });

    test("registers error handler on plebbit instance", async () => {
      let errorHandler: ((err: any) => void) | null = null;
      const OrigPlebbit = PlebbitJsMock;
      const WrapperPlebbit = async (opts: any) => {
        const p = await OrigPlebbit(opts);
        const origOn = p.on.bind(p);
        p.on = (event: string, fn: any) => {
          if (event === "error") errorHandler = fn;
          return origOn(event, fn);
        };
        return p;
      };
      setPlebbitJs(WrapperPlebbit);
      try {
        const account = await accountGenerator.generateDefaultAccount();
        expect(errorHandler).toBeDefined();
        expect(typeof errorHandler).toBe("function");
        account.plebbit.emit("error", new Error("test error"));
      } finally {
        setPlebbitJs(PlebbitJsMock);
      }
    });

    test("increments account name when multiple exist", async () => {
      const acc1 = await accountGenerator.generateDefaultAccount();
      await accountsDatabase.addAccount(acc1);
      const acc2 = await accountGenerator.generateDefaultAccount();
      expect(acc2.name).toBe("Account 2");
    });
  });
});
