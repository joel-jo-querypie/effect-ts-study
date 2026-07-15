import { SqlClient } from "@effect/sql";
import { Effect, Layer } from "effect";
import type { ActiveTodo } from "../../domain/todo";
import type { TodoId } from "../../domain/todo-id";
import { TodoNotFound } from "../../services/errors";
import { TodoRepository } from "../../services/todo-repository";
import { toStorageError } from "../sqlite/errors";
import {
  completedTodoFromRow,
  deletedTodoFromRow,
  listedTodosFromRows,
  type TodoRow,
} from "./sqlite-row";

export const SqliteTodoRepositoryLive = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const findPersistedTodo = (id: TodoId) =>
      sql<TodoRow>`
        SELECT *
        FROM todos
        WHERE id = ${id} AND status != 'deleted'
        LIMIT 1
      `.pipe(
        Effect.mapError(toStorageError("find todo")),
        Effect.flatMap((rows) =>
          rows[0] === undefined
            ? Effect.fail(new TodoNotFound({ id }))
            : Effect.succeed(rows[0]),
        ),
      );

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

      list: sql<TodoRow>`
        SELECT *
        FROM todos
        WHERE status != 'deleted'
        ORDER BY created_at_millis ASC
      `.pipe(
        Effect.mapError(toStorageError("list todos")),
        Effect.flatMap(listedTodosFromRows),
      ),

      markDone: (id, completedAtMillis) =>
        Effect.gen(function* () {
          const foundTodo = yield* findPersistedTodo(id);

          if (foundTodo.status === "completed") {
            return yield* completedTodoFromRow(foundTodo);
          }

          const rows = yield* sql<TodoRow>`
            UPDATE todos
            SET
              status = 'completed',
              completed_at_millis = ${completedAtMillis}
            WHERE id = ${id}
            RETURNING *
          `.pipe(Effect.mapError(toStorageError("complete todo")));

          const completedRow = rows[0];
          if (completedRow === undefined) {
            return yield* Effect.fail(new TodoNotFound({ id }));
          }

          return yield* completedTodoFromRow(completedRow);
        }),

      delete: (id, deletedAtMillis) =>
        Effect.gen(function* () {
          yield* findPersistedTodo(id);
          const rows = yield* sql<TodoRow>`
            UPDATE todos
            SET
              status = 'deleted',
              deleted_at_millis = ${deletedAtMillis}
            WHERE id = ${id}
            RETURNING *
          `.pipe(Effect.mapError(toStorageError("delete todo")));

          const deletedRow = rows[0];
          if (deletedRow === undefined) {
            return yield* Effect.fail(new TodoNotFound({ id }));
          }

          return yield* deletedTodoFromRow(deletedRow);
        }),
    });
  }),
);
