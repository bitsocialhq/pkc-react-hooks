import type PkcJs from "@pkcprotocol/pkc-js";

export type PkcClient = Awaited<ReturnType<typeof PkcJs>>;
export type PkcResolveAuthorName = PkcClient["resolveAuthorName"];
export type PkcResolveAuthorNameOptions = Parameters<PkcResolveAuthorName>[0];
export type PkcResolveAuthorNameResult = Awaited<ReturnType<PkcResolveAuthorName>>;
