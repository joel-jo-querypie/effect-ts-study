import { SqlClient } from "@effect/sql";
import { Effect, Layer } from "effect";
import { AtomicRunner } from "../../services/atomic-runner";
import { isSqlError, toStorageError } from "../sqlite/errors";

export const SqliteAtomicRunnerLive = Layer.effect(
  AtomicRunner,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return AtomicRunner.of({
      run: (effect) =>
        sql.withTransaction(effect).pipe(
          Effect.mapError((error) =>
            isSqlError(error) ? toStorageError("run atomically")(error) : error,
          ),
        ),
    });
  }),
);
