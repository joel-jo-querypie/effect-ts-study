import { SqlClient } from "@effect/sql";
import { Effect, Layer } from "effect";
import type { ActiveTodo } from "../../domain/todo";
import type { TodoId } from "../../domain/todo-id";
import { TodoAlreadyCompleted } from "../../domain/error";
import { TodoNotFound } from "../../services/errors";
import { TodoRepository } from "../../services/todo-repository";
import { toStorageError } from "../sqlite/errors";
import {
  completedTodoFromRow,
  deletedTodoFromRow,
  listedTodosFromRows,
} from "./sqlite-row";

export const SqliteTodoRepositoryLive = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const findStatus = (id: TodoId) =>
      sql<{ readonly status: "active" | "completed" | "deleted" }>`
        SELECT status
        FROM todos
        WHERE id = ${id}
        LIMIT 1
      `.pipe(Effect.mapError(toStorageError("find todo status")));

    return TodoRepository.of({
      add: (todo: ActiveTodo) =>
        sql`
          INSERT INTO todos (
            id,
            title,
            status,
            created_at_millis
          ) VALUES (
            ${todo.id},
            ${todo.title},
            'active',
            ${todo.createdAtMillis}
          )
        `.pipe(
          Effect.mapError(toStorageError("insert todo")),
          Effect.as(todo),
        ),

      list: (options) =>
        sql<Record<string, unknown>>`
          SELECT *
          FROM todos
          WHERE deleted_at_millis IS NULL
          ORDER BY created_at_millis ASC, id ASC
          LIMIT ${options.limit + 1}
          OFFSET ${options.offset}
        `.pipe(
          Effect.mapError(toStorageError("list todos")),
          Effect.flatMap(listedTodosFromRows),
          Effect.map((items) => ({
            items: items.slice(0, options.limit),
            ...(items.length > options.limit
              ? { nextOffset: options.offset + options.limit }
              : {}),
          })),
        ),

      markDone: (id, completedAtMillis) =>
        Effect.gen(function* () {
          const rows = yield* sql<Record<string, unknown>>`
            UPDATE todos
            SET
              status = 'completed',
              completed_at_millis = ${completedAtMillis}
            WHERE id = ${id} AND status = 'active'
            RETURNING *
          `.pipe(Effect.mapError(toStorageError("complete todo")));

          const completedRow = rows[0];
          if (completedRow !== undefined) {
            return yield* completedTodoFromRow(completedRow);
          }

          const statuses = yield* findStatus(id);
          if (statuses[0]?.status === "completed") {
            return yield* Effect.fail(new TodoAlreadyCompleted({ id }));
          }

          return yield* Effect.fail(new TodoNotFound({ id }));
        }),

      delete: (id, deletedAtMillis) =>
        Effect.gen(function* () {
          const rows = yield* sql<Record<string, unknown>>`
            UPDATE todos
            SET
              status = 'deleted',
              deleted_at_millis = ${deletedAtMillis}
            WHERE id = ${id} AND status IN ('active', 'completed')
            RETURNING *
          `.pipe(Effect.mapError(toStorageError("delete todo")));

          const deletedRow = rows[0];
          if (deletedRow !== undefined) {
            return yield* deletedTodoFromRow(deletedRow);
          }

          return yield* Effect.fail(new TodoNotFound({ id }));
        }),
    });
  }),
);
