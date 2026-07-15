import { SqlClient } from "@effect/sql";
import { Effect, Layer } from "effect";
import { toStorageError } from "./errors";

/**
 *
 */
export const SqliteSchemaLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    yield* sql`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'blocked', 'completed', 'deleted')),
        created_at_millis INTEGER NOT NULL,
        blocked_reason TEXT,
        blocked_at_millis INTEGER,
        completed_at_millis INTEGER,
        deleted_at_millis INTEGER
      )
    `.pipe(Effect.mapError(toStorageError("create todos table")));

    yield* sql`
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
    `.pipe(Effect.mapError(toStorageError("create audit logs table")));
  }),
);
