import { SqlClient } from "@effect/sql";
import { expect, it } from "@effect/vitest";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import {
  RandomTodoIdGeneratorLive,
  requestContextLayer,
  sqliteClientLayer,
  SqliteAtomicRunnerLive,
  sqlitePersistenceLayer,
  SqliteSchemaLive,
  SqliteTodoRepositoryLive,
} from "../src/layers";
import { addTodo } from "../src/programs";
import { StorageError } from "../src/services/errors";
import { TodoEventStore } from "../src/services/todo-event-store";

type AuditLogRow = {
  readonly request_id: string;
  readonly actor_id: string | null;
  readonly action: string;
  readonly target_todo_id: string;
  readonly result: string;
};

let nextDbId = 0;

const makeDbFile = () =>
  join(tmpdir(), `effect-todo-server-${Date.now()}-${nextDbId++}.sqlite`);

it.effect("persists todo changes and audit logs with request context", () => {
  const dbFile = makeDbFile();
  const SqliteLive = Layer.provideMerge(
    sqlitePersistenceLayer,
    sqliteClientLayer(dbFile),
  );
  const TestLive = Layer.mergeAll(
    SqliteLive,
    RandomTodoIdGeneratorLive,
    requestContextLayer({
      requestId: "req-sqlite-create",
      actorId: "actor-sqlite-test",
    }),
  );

  return Effect.gen(function* () {
    const added = yield* addTodo("persist with audit");
    const sql = yield* SqlClient.SqlClient;
    const auditLogs = yield* sql<AuditLogRow>`
      SELECT
        request_id,
        actor_id,
        action,
        target_todo_id,
        result
      FROM audit_logs
    `;

    expect(auditLogs).toEqual([
      {
        request_id: "req-sqlite-create",
        actor_id: "actor-sqlite-test",
        action: "CreateTodo",
        target_todo_id: added.id,
        result: "Succeeded",
      },
    ]);
  }).pipe(
    Effect.provide(TestLive),
    Effect.ensuring(Effect.sync(() => rmSync(dbFile, { force: true }))),
  );
});

it.effect("rolls back todo changes when audit append fails", () => {
  const dbFile = makeDbFile();
  const FailingTodoEventStoreLive = Layer.succeed(
    TodoEventStore,
    TodoEventStore.of({
      append: () =>
        Effect.fail(
          new StorageError({
            operation: "append audit log",
            message: "forced failure",
          }),
        ),
    }),
  );
  const SqliteLive = Layer.provideMerge(
    Layer.mergeAll(
      SqliteSchemaLive,
      SqliteTodoRepositoryLive,
      SqliteAtomicRunnerLive,
      FailingTodoEventStoreLive,
    ),
    sqliteClientLayer(dbFile),
  );
  const TestLive = Layer.mergeAll(
    SqliteLive,
    RandomTodoIdGeneratorLive,
    requestContextLayer({ requestId: "req-rollback" }),
  );

  return Effect.gen(function* () {
    const result = yield* Effect.either(addTodo("rollback me"));
    const sql = yield* SqlClient.SqlClient;
    const todos = yield* sql<{ readonly count: number }>`
      SELECT COUNT(*) AS count
      FROM todos
    `;

    expect(result._tag).toBe("Left");
    expect(todos).toEqual([{ count: 0 }]);
  }).pipe(
    Effect.provide(TestLive),
    Effect.ensuring(Effect.sync(() => rmSync(dbFile, { force: true }))),
  );
});
