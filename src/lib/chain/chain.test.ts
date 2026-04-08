import { getNftImageUrl, validateEthWalletViem, getWalletMessageToSign } from ".";
import {
  getEthWalletFromPkcPrivateKey,
  getSolWalletFromPkcPrivateKey,
  getEthPrivateKeyFromPkcPrivateKey,
  getSolPrivateKeyFromPkcPrivateKey,
  validateEthWallet,
  validateSolWallet,
} from "../..";

const avatarNft1 = {
  chainTicker: "eth",
  address: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", // the contract address of the nft
  id: 100, // the nft number 100 in the colletion
};
const avatarNft2 = {
  chainTicker: "matic",
  address: "0xf6d8e606c862143556b342149a7fe0558c220375", // the contract address of the nft
  id: 100, // the nft number 100 in the colletion
};

const ipfsGatewayUrl = "https://cloudflare-ipfs.com";

const chainProviders = {
  eth: {
    // default should not use a url, but rather ethers.js default provider
    urls: ["ethers.js"],
    chainId: 1,
  },
  avax: {
    urls: ["https://api.avax.network/ext/bc/C/rpc"],
    chainId: 43114,
  },
  matic: {
    urls: ["https://polygon-rpc.com"],
    chainId: 137,
  },
};

const pkcPrivateKey = "mV8GRU5TGScen7UYZOuNQQ1CKe2G46DCc60moM1yLF4";
const authorAddress = "authoraddress.eth";
const walletTimestamp = 1740000000;

describe("chain", () => {
  describe("nft", () => {
    const timeout = 30000;

    // skip because uses internet and not deterministic
    // also cache and pending is difficult to test without console logging it
    test.skip("getNftImageUrl (cache and pending)", { timeout }, async () => {
      // const url = await getNftImageUrl(avatarNft1, ipfsGatewayUrl, chainProviders)
      // console.log(url)
      // const cachedUrl = await getNftImageUrl(avatarNft1, ipfsGatewayUrl, chainProviders)
      // console.log(cachedUrl)
      // const res = await Promise.all([getNftImageUrl(avatarNft2, ipfsGatewayUrl, chainProviders), getNftImageUrl(avatarNft2, ipfsGatewayUrl, chainProviders)])
      // console.log(res)
    });
  });

  describe("eth wallet", () => {
    let wallet, privateKey;
    beforeAll(async () => {
      privateKey = await getEthPrivateKeyFromPkcPrivateKey(pkcPrivateKey);
      const dateNow = Date.now;
      Date.now = () => walletTimestamp * 1000;
      wallet = await getEthWalletFromPkcPrivateKey(pkcPrivateKey, authorAddress);
      Date.now = dateNow;
    });

    test("getWalletMessageToSign", () => {
      const string = getWalletMessageToSign(authorAddress, walletTimestamp);
      const json = JSON.parse(string);
      expect(json.domainSeparator).toBe("pkc-author-wallet");
      expect(json.authorAddress).toBe(authorAddress);
      expect(json.authorAddress).not.toBe(undefined);
      expect(json.timestamp).toBe(walletTimestamp);
      expect(json.timestamp).not.toBe(undefined);
      expect(string).toBe(JSON.stringify(json));
    });

    test("getEthWalletFromPkcPrivateKey", async () => {
      expect(wallet.timestamp).toBe(walletTimestamp);
      expect(wallet.address).toBe("0x37BC48124fDf985DC3983E2e8414606D4a996ED7");
      expect(wallet.privateKey).toBe(undefined);
      expect(privateKey).toBe("0x995f06454e5319271e9fb51864eb8d410d4229ed86e3a0c273ad26a0cd722c5e");
      expect(wallet.signature.type).toBe("eip191");
      expect(wallet.signature.signature).toBe(
        "0xd1a3c404b8143421026957982a47aa490b69bce1fcfcd96e5715cfcd6139196f2b616958a5a2febc1ee9601daeca4786c68bac583757818ef60786f0604d2d5b1b",
      );
    });

    test("validateEthWallet", async () => {
      // good signature
      await validateEthWallet(wallet, authorAddress);

      // make sure viem also works
      await validateEthWalletViem(wallet, authorAddress);

      // bad signatures
      await expect(
        validateEthWallet({ ...wallet, timestamp: wallet.timestamp + 1 }, authorAddress),
      ).rejects.toThrow("wallet address does not equal signature address");
      await expect(validateEthWallet(wallet, "invalidauthoraddress.eth")).rejects.toThrow(
        "wallet address does not equal signature address",
      );
      await expect(
        validateEthWallet({ ...wallet, timestamp: undefined }, authorAddress),
      ).rejects.toThrow(`validateEthWallet invalid wallet.timestamp 'undefined' not a number`);
      await expect(
        validateEthWallet({ ...wallet, signature: undefined }, authorAddress),
      ).rejects.toThrow(`validateEthWallet invalid wallet.signature 'undefined'`);
      await expect(
        validateEthWallet({ ...wallet, signature: { type: "eip191" } }, authorAddress),
      ).rejects.toThrow(`validateEthWallet invalid wallet.signature.signature 'undefined'`);
      await expect(validateEthWallet({ ...wallet, signature: {} }, authorAddress)).rejects.toThrow(
        `validateEthWallet invalid wallet.signature.signature 'undefined'`,
      );
      await expect(
        validateEthWallet({ ...wallet, address: undefined }, authorAddress),
      ).rejects.toThrow(`validateEthWallet invalid wallet.address 'undefined'`);
      await expect(
        validateEthWallet(
          { ...wallet, address: "0x0000000000000000000000000000000000000000" },
          authorAddress,
        ),
      ).rejects.toThrow("wallet address does not equal signature address");
    });

    test("validateEthWallet fixture wallet", async () => {
      const authorAddress = "authoraddress.eth";
      const wallet = {
        address: "0x37BC48124fDf985DC3983E2e8414606D4a996ED7",
        timestamp: 1740000000,
        signature: {
          signature:
            "0xd1a3c404b8143421026957982a47aa490b69bce1fcfcd96e5715cfcd6139196f2b616958a5a2febc1ee9601daeca4786c68bac583757818ef60786f0604d2d5b1b",
          type: "eip191",
        },
      };
      await validateEthWallet(wallet, authorAddress);
      await validateEthWalletViem(wallet, authorAddress);
    });

    test("fixture wallet 2", async () => {
      const pkcPrivateKey = "Q2dsIzBWgHZuof0Aq1KhtMhmW2z5gM8NYY0NL+daBcI";
      const authorAddress = "12D3KooWNzFJQ7CCcSCZNg7925WWHMzqVS4qe663PfQ3uBNCHZQb";
      const wallet = {
        address: "0x9097084f571AF3BFcc64E4dcA33FB3223071E4aB",
        timestamp: 1759958639,
        signature: {
          signature:
            "0xc0248dd8dd2273612de17eedda131bb0152c9751f21d0aa1f7306f52124ec6985cd1c0584d6d04adaf5856862001241758687d5f1fd7bd67c47d748be400a68b1b",
          type: "eip191",
        },
      };

      const dateNow = Date.now;
      Date.now = () => wallet.timestamp * 1000;
      const generatedWallet = await getEthWalletFromPkcPrivateKey(pkcPrivateKey, authorAddress);
      Date.now = dateNow;

      expect(wallet.address).toBe(generatedWallet.address);
      expect(wallet.timestamp).toBe(generatedWallet.timestamp);
      expect(wallet.signature.signature).toBe(generatedWallet.signature.signature);

      await validateEthWallet(wallet, authorAddress);
      await validateEthWalletViem(wallet, authorAddress);
    });
  });

  describe("sol wallet", () => {
    let wallet, privateKey;
    beforeAll(async () => {
      privateKey = await getSolPrivateKeyFromPkcPrivateKey(pkcPrivateKey);
      const dateNow = Date.now;
      Date.now = () => walletTimestamp * 1000;
      wallet = await getSolWalletFromPkcPrivateKey(pkcPrivateKey, authorAddress);
      Date.now = dateNow;
    });

    test("getSolWalletFromPkcPrivateKey", async () => {
      expect(wallet.timestamp).toBe(walletTimestamp);
      expect(wallet.address).toBe("AzAfDLMxbptaq5Ppy4BK5aEsEzvTYNFAub5ffewbSdn9");
      expect(wallet.privateKey).toBe(undefined);
      expect(privateKey).toBe(
        "44rJnvSKZwF6qMrc49MVe4KqcugR8zc8B4i1yo9iXrvKsf6FAFB7x1dSNdbAqqga4xvpU7VmnKRkwyvQWxrcBmGV",
      );
      expect(wallet.signature.type).toBe("sol");
      expect(wallet.signature.signature).toBe(
        "41oBEqrNWgebTxySit2s6nYsEf6feFW5xftLnDhaFx3hfsUuUMTTGvf5N8DJF8fqUrHqNVwhBqZyzRsp34PeDy7c",
      );
    });

    test("validateSolWallet", async () => {
      // good signature
      await validateSolWallet(wallet, authorAddress);

      // bad signatures
      await expect(
        validateSolWallet({ ...wallet, timestamp: wallet.timestamp + 1 }, authorAddress),
      ).rejects.toThrow("signature invalid");
      await expect(validateSolWallet(wallet, "invalidauthoraddress.eth")).rejects.toThrow(
        "signature invalid",
      );
      await expect(
        validateSolWallet({ ...wallet, timestamp: undefined }, authorAddress),
      ).rejects.toThrow(`validateSolWallet invalid wallet.timestamp 'undefined' not a number`);
      await expect(
        validateSolWallet({ ...wallet, signature: undefined }, authorAddress),
      ).rejects.toThrow(`validateSolWallet invalid wallet.signature 'undefined'`);
      await expect(validateSolWallet({ ...wallet, signature: {} }, authorAddress)).rejects.toThrow(
        `validateSolWallet invalid wallet.signature.signature 'undefined'`,
      );
      await expect(
        validateSolWallet({ ...wallet, address: undefined }, authorAddress),
      ).rejects.toThrow(`validateSolWallet invalid wallet.address 'undefined'`);
      await expect(
        validateSolWallet(
          { ...wallet, address: "11111111111111111111111111111111" },
          authorAddress,
        ),
      ).rejects.toThrow("signature invalid");
    });

    test("validateSolWallet fixture wallet", async () => {
      const authorAddress = "authoraddress.eth";
      const wallet = {
        address: "AzAfDLMxbptaq5Ppy4BK5aEsEzvTYNFAub5ffewbSdn9",
        timestamp: 1740000000,
        signature: {
          signature:
            "41oBEqrNWgebTxySit2s6nYsEf6feFW5xftLnDhaFx3hfsUuUMTTGvf5N8DJF8fqUrHqNVwhBqZyzRsp34PeDy7c",
          type: "sol",
        },
      };
      await validateSolWallet(wallet, authorAddress);
    });
  });
});
