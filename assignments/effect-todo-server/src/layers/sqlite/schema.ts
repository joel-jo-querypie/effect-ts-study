import { SqlClient } from "@effect/sql";
import { Effect, Layer } from "effect";
import { toStorageError } from "./errors";

type ExistingTable = { readonly name: string };
type ExistingColumn = { readonly name: string };

const createTodosTable = (sql: SqlClient.SqlClient) =>
  sql`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'deleted')),
      created_at_millis INTEGER NOT NULL CHECK (created_at_millis >= 0),
      completed_at_millis INTEGER,
      deleted_at_millis INTEGER,
      CHECK (
        (status = 'active' AND completed_at_millis IS NULL AND deleted_at_millis IS NULL) OR
        (status = 'completed' AND completed_at_millis IS NOT NULL AND deleted_at_millis IS NULL) OR
        (status = 'deleted' AND deleted_at_millis IS NOT NULL)
      )
    )
  `;

const createAuditLogsTable = (sql: SqlClient.SqlClient) =>
  sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL,
      actor_id TEXT,
      action TEXT NOT NULL,
      target_todo_id TEXT NOT NULL,
      result TEXT NOT NULL,
      reason TEXT,
      occurred_at_millis INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    )
  `;

const migrateLegacyTodos = (sql: SqlClient.SqlClient) =>
  Effect.gen(function* () {
    yield* sql`ALTER TABLE todos RENAME TO todos_legacy`;
    yield* createTodosTable(sql);
    yield* sql`
      INSERT INTO todos (
        id,
        title,
        status,
        created_at_millis,
        completed_at_millis,
        deleted_at_millis
      )
      SELECT
        id,
        title,
        CASE WHEN status = 'blocked' THEN 'active' ELSE status END,
        created_at_millis,
        completed_at_millis,
        deleted_at_millis
      FROM todos_legacy
    `;
    yield* sql`DROP TABLE todos_legacy`;
  });

export const SqliteSchemaLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    yield* sql.withTransaction(
      Effect.gen(function* () {
        const existingTables = yield* sql<ExistingTable>`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table' AND name = 'todos'
        `;

        if (existingTables[0] === undefined) {
          yield* createTodosTable(sql);
        } else {
          const columns = yield* sql<ExistingColumn>`PRAGMA table_info(todos)`;
          const isLegacyBlockedSchema = columns.some(
            (column) => column.name === "blocked_reason",
          );

          if (isLegacyBlockedSchema) {
            yield* migrateLegacyTodos(sql);
          }
        }

        yield* createAuditLogsTable(sql);
        yield* sql`
          CREATE INDEX IF NOT EXISTS todos_list_active_idx
          ON todos (created_at_millis, id)
          WHERE deleted_at_millis IS NULL
        `;
        yield* sql`PRAGMA user_version = 1`;
      }),
    ).pipe(Effect.mapError(toStorageError("migrate SQLite schema")));
  }),
);
