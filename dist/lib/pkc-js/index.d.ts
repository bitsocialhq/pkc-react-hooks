declare const protocolClient: any;
/**
 * Replace the underlying protocol client with a different implementation, for
 * example to mock it during unit tests, to add mock content
 * for developing the front-end or to add a PKC-compatible client with
 * desktop privileges in the Electron build.
 */
export declare function setPkcJs(_PKC: any): void;
export declare function restorePkcJs(): void;
export default protocolClient;
//# sourceMappingURL=index.d.ts.map