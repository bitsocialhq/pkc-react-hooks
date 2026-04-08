import localForage from "localforage";
import localForageLru from "../lib/localforage-lru";
const deleteDatabases = () => Promise.all([
    localForage.createInstance({ name: "bitsocialReactHooks-accountsMetadata" }).clear(),
    localForage.createInstance({ name: "bitsocialReactHooks-accounts" }).clear(),
    localForageLru.createInstance({ name: "bitsocialReactHooks-communities" }).clear(),
    localForageLru.createInstance({ name: "bitsocialReactHooks-comments" }).clear(),
    localForageLru.createInstance({ name: "bitsocialReactHooks-communitiesPages" }).clear(),
]);
const deleteCaches = () => Promise.all([
    localForageLru.createInstance({ name: "bitsocialReactHooks-communities" }).clear(),
    localForageLru.createInstance({ name: "bitsocialReactHooks-comments" }).clear(),
    localForageLru.createInstance({ name: "bitsocialReactHooks-communitiesPages" }).clear(),
]);
const debugUtils = {
    deleteDatabases,
    deleteCaches,
};
export { deleteDatabases, deleteCaches };
export default debugUtils;
