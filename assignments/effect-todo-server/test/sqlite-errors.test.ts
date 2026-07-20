import { expect, it } from "@effect/vitest";
import {
  toAtomicRunnerFailure,
  toStorageError,
} from "../src/layers/sqlite/errors";

it("maps SQLite locking to a storage failure", () => {
  const error = toStorageError("insert todo")({
    code: "SQLITE_BUSY",
    message: "database is locked",
  });

  expect(error._tag).toBe("StorageError");
});

it("maps SQLite constraints to a storage failure", () => {
  const error = toStorageError("insert todo")({
    code: "SQLITE_CONSTRAINT_CHECK",
    message: "CHECK constraint failed",
  });

  expect(error._tag).toBe("StorageError");
});

it("maps transaction infrastructure failures to the AtomicRunner contract", () => {
  const error = toAtomicRunnerFailure("run atomically")({
    message: "transaction commit failed",
  });

  expect(error._tag).toBe("AtomicRunnerFailure");
});
