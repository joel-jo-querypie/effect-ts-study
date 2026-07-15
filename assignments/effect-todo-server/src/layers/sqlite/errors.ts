import type { SqlError } from "@effect/sql/SqlError";
import {
  AtomicRunnerFailure,
  StorageError,
} from "../../services/errors";

const errorMessage = (cause: unknown): string =>
  cause instanceof Error
    ? cause.message
    : typeof cause === "object" && cause !== null && "message" in cause
      ? String(cause.message)
      : String(cause);

export const toStorageError =
  (operation: string) =>
  (cause: unknown): StorageError =>
    new StorageError({
      operation,
      message: errorMessage(cause),
    });

export const toAtomicRunnerFailure = (operation: string) => (cause: unknown) =>
  new AtomicRunnerFailure({
    operation,
    message: errorMessage(cause),
  });

export const isSqlError = (cause: unknown): cause is SqlError =>
  typeof cause === "object" &&
  cause !== null &&
  "_tag" in cause &&
  cause._tag === "SqlError"; //effect/sql을 직접 확인. // SqlErrorTypeId in cause
