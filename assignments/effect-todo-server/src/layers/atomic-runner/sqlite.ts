import { SqlClient } from "@effect/sql";
import { Effect, Layer } from "effect";
import { AtomicRunner } from "../../services/atomic-runner";
import { isSqlError, toAtomicRunnerFailure } from "../sqlite/errors";

export const SqliteAtomicRunnerLive = Layer.effect(
  AtomicRunner,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    // TODO: transaction 이 실패했을 때는 별도의 비지니스 로직 처리가 필요한가?
    return AtomicRunner.of({
      run: (effect) =>
        sql.withTransaction(effect).pipe(
          Effect.mapError((error) =>
            isSqlError(error)
              ? toAtomicRunnerFailure("run atomically")(error)
              : error,
          ),
        ),
    });
  }),
);
