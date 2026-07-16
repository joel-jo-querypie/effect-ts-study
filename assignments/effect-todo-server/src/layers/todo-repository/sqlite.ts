import { SqlClient } from "@effect/sql";
import { Effect, Layer, Schema } from "effect";
import type {
  ActiveTodo,
  CompletedTodo,
  DeletedTodo,
} from "../../domain/todo";
import type { TodoId } from "../../domain/todo-id";
import { TodoAlreadyCompleted } from "../../domain/error";
import { TodoNotFound } from "../../services/errors";
import { TodoRepository } from "../../services/todo-repository";
import { toStorageError } from "../sqlite/errors";
import {
  completedTodoFromRow,
  deletedTodoFromRow,
  listedTodosFromRows,
  todoFromRow,
} from "./sqlite-row";

export const SqliteTodoRepositoryLive = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    const PersistedTodoStatus = Schema.Literal("active", "completed", "deleted");
    const TodoStatusRow = Schema.Struct({ status: PersistedTodoStatus });

    // TODO: SQL generic은 TypeScript에만 타입을 알린다. 실제 DB 결과를 파싱한 뒤에만
    // 이미 완료된 domain 상태 전이인지 판단한다.
    const findStatus = (id: TodoId) =>
      sql<Record<string, unknown>>`
        SELECT status
        FROM todos
        WHERE id = ${id}
        LIMIT 1
      `.pipe(
        Effect.mapError(toStorageError("find todo status")),
        Effect.flatMap((rows) =>
          Effect.all(
            rows.map((row) => Schema.decodeUnknown(TodoStatusRow)(row)),
          ).pipe(
            Effect.mapError(toStorageError("decode todo status row")),
          ),
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

      find: (id) =>
        Effect.gen(function* () {
          const rows = yield* sql<Record<string, unknown>>`
            SELECT *
            FROM todos
            WHERE id = ${id}
            LIMIT 1
          `.pipe(Effect.mapError(toStorageError("find todo")));

          const row = rows[0];
          if (row === undefined) {
            return yield* Effect.fail(new TodoNotFound({ id }));
          }

          const todo = yield* todoFromRow(row);
          if (todo._tag === "DeletedTodo") {
            return yield* Effect.fail(new TodoNotFound({ id }));
          }

          return todo;
        }),

      saveCompletedIfActive: (todo: CompletedTodo) =>
        Effect.gen(function* () {
          const rows = yield* sql<Record<string, unknown>>`
            UPDATE todos
            SET
              status = 'completed',
              completed_at_millis = ${todo.completedAtMillis}
            WHERE id = ${todo.id} AND status = 'active'
            RETURNING *
          `.pipe(Effect.mapError(toStorageError("complete todo")));

          const completedRow = rows[0];
          if (completedRow !== undefined) {
            return yield* completedTodoFromRow(completedRow);
          }

          const statuses = yield* findStatus(todo.id);
          if (statuses[0]?.status === "completed") {
            return yield* Effect.fail(new TodoAlreadyCompleted({ id: todo.id }));
          }

          return yield* Effect.fail(new TodoNotFound({ id: todo.id }));
        }),

      saveDeletedIfDeletable: (todo: DeletedTodo) =>
        Effect.gen(function* () {
          const rows = yield* sql<Record<string, unknown>>`
            UPDATE todos
            SET
              status = 'deleted',
              deleted_at_millis = ${todo.deletedAtMillis}
            WHERE id = ${todo.id} AND status IN ('active', 'completed')
            RETURNING *
          `.pipe(Effect.mapError(toStorageError("delete todo")));

          const deletedRow = rows[0];
          if (deletedRow !== undefined) {
            return yield* deletedTodoFromRow(deletedRow);
          }

          return yield* Effect.fail(new TodoNotFound({ id: todo.id }));
        }),
    });
  }),
);
