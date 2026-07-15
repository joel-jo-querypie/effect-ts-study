import type { SqlError } from "@effect/sql/SqlError";
import { StorageError } from "../../services/errors";

export const toStorageError = (operation: string) => (cause: unknown) =>
  new StorageError({
    operation,
    message:
      cause instanceof Error
        ? cause.message
        : typeof cause === "object" && cause !== null && "message" in cause
          ? String(cause.message)
          : String(cause),
  });

export const isSqlError = (cause: unknown): cause is SqlError =>
  typeof cause === "object" &&
  cause !== null &&
  "_tag" in cause &&
  cause._tag === "SqlError"; //effect/sql을 직접 확인. // SqlErrorTypeId in cause
