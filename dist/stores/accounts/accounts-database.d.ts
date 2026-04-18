import { Accounts, CreateCommentOptions, Account, Comment, AccountsComments, AccountCommentReply, AccountsCommentsReplies, AccountEditsSummary } from "../../types.js";
declare const database: {
    accountsDatabase: LocalForage;
    accountsMetadataDatabase: LocalForage;
    getAccountsVotes: (accountIds: string[]) => Promise<any>;
    getAccountVotes: (accountId: string) => Promise<any>;
    addAccountVote: (accountId: string, createVoteOptions: CreateCommentOptions) => Promise<void>;
    getAccountsComments: (accountIds: string[]) => Promise<AccountsComments>;
    getAccountComments: (accountId: string) => Promise<any[]>;
    addAccountComment: (accountId: string, comment: CreateCommentOptions | Comment, accountCommentIndex?: number) => Promise<void>;
    deleteAccountComment: (accountId: string, accountCommentIndex: number) => Promise<void>;
    addAccount: (account: Account) => Promise<void>;
    removeAccount: (account: Account) => Promise<void>;
    getExportedAccountJson: (accountId: string) => Promise<string>;
    getAccounts: (accountIds: string[]) => Promise<Accounts>;
    getAccount: (accountId: string) => Promise<Account>;
    addAccountCommentReply: (accountId: string, reply: AccountCommentReply) => Promise<void>;
    getAccountCommentsReplies: (accountId: string) => Promise<{}>;
    getAccountsCommentsReplies: (accountIds: string[]) => Promise<AccountsCommentsReplies>;
    getAccountsEdits: (accountIds: string[]) => Promise<any>;
    getAccountEdits: (accountId: string) => Promise<any>;
    getAccountsEditsSummaries: (accountIds: string[]) => Promise<{
        [k: string]: AccountEditsSummary;
    }>;
    getAccountEditsSummary: (accountId: string) => Promise<AccountEditsSummary>;
    addAccountEdit: (accountId: string, createEditOptions: CreateCommentOptions) => Promise<void>;
    deleteAccountEdit: (accountId: string, editToDelete: CreateCommentOptions) => Promise<boolean>;
    accountVersion: number;
    migrate: () => Promise<void>;
    getAccountsDatabaseName: (databaseName: string) => string;
    getPerAccountDatabaseName: (databaseName: string, accountId: string) => string;
};
export default database;
//# sourceMappingURL=accounts-database.d.ts.map