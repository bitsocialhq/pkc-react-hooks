# Commit and Issue Format

Use this when proposing or implementing meaningful code changes.

## Commit Suggestion Format

- **Title:** Conventional Commits style, short, wrapped in backticks.
- Use `perf` (not `fix`) for performance optimizations.
- **Description:** Optional 2-3 informal sentences describing the solution. Concise, technical, no bullet points.

Example:

> **Commit title:** `fix(feeds): handle empty subplebbit addresses in useFeed`
>
> Updated `useFeed` in `feeds.ts` to early-return when given an empty addresses array instead of creating a broken store subscription.

## GitHub Issue Suggestion Format

- **Title:** As short as possible, wrapped in backticks.
- **Description:** 2-3 informal sentences describing the problem (not the solution), as if still unresolved.

Example:

> **GitHub issue:**
> - **Title:** `useFeed crashes with empty subplebbit addresses`
> - **Description:** Passing an empty `subplebbitAddresses` array to `useFeed` causes the feeds store to create an invalid subscription key. This triggers an unhandled error in downstream consumers.
