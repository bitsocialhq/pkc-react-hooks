import { Comment } from "../../types";

const moderationPropertyNames = [
  "spoiler",
  "nsfw",
  "pinned",
  "locked",
  "archived",
  "approved",
  "removed",
  "purged",
  "reason",
] as const;

export function addCommentModeration(comment: Comment | undefined): Comment | undefined {
  if (!comment) {
    return comment;
  }

  let nextCommentModeration =
    comment.commentModeration && typeof comment.commentModeration === "object"
      ? comment.commentModeration
      : undefined;
  let changed = false;

  for (const propertyName of moderationPropertyNames) {
    const propertyValue = comment[propertyName];
    if (propertyValue === undefined) {
      continue;
    }

    if (!nextCommentModeration) {
      nextCommentModeration = {};
      changed = true;
    }

    if (nextCommentModeration[propertyName] !== propertyValue) {
      if (nextCommentModeration === comment.commentModeration) {
        nextCommentModeration = { ...comment.commentModeration };
      }
      nextCommentModeration[propertyName] = propertyValue;
      changed = true;
    }
  }

  if (!changed) {
    return comment;
  }

  return { ...comment, commentModeration: nextCommentModeration };
}

export function addCommentModerationToComments<T extends Comment | undefined>(
  comments: T[] | undefined,
): T[] {
  if (!comments) {
    return [] as T[];
  }

  let changed = false;
  const normalizedComments = comments.map((comment) => {
    const normalizedComment = addCommentModeration(comment) as T;
    if (normalizedComment !== comment) {
      changed = true;
    }
    return normalizedComment;
  });

  return changed ? normalizedComments : comments;
}
