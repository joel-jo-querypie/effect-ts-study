import { Effect, ParseResult, Schema } from "effect";
import { epochMillisFromNumber } from "../../domain/epoch-millis";
import { Todo, type ListedTodo } from "../../domain/todo";
import { TodoId } from "../../domain/todo-id";
import { TodoTitle } from "../../domain/todo-title";
import { StorageError } from "../../services/errors";

const PersistedMillis = Schema.Number.pipe(Schema.int(), Schema.nonNegative());

const ActiveTodoRow = Schema.Struct({
  id: TodoId,
  title: TodoTitle,
  status: Schema.Literal("active"),
  created_at_millis: PersistedMillis,
  completed_at_millis: Schema.Null,
  deleted_at_millis: Schema.Null,
});

const CompletedTodoRow = Schema.Struct({
  id: TodoId,
  title: TodoTitle,
  status: Schema.Literal("completed"),
  created_at_millis: PersistedMillis,
  completed_at_millis: PersistedMillis,
  deleted_at_millis: Schema.Null,
});

const DeletedTodoRow = Schema.Struct({
  id: TodoId,
  title: TodoTitle,
  status: Schema.Literal("deleted"),
  created_at_millis: PersistedMillis,
  completed_at_millis: Schema.NullOr(PersistedMillis),
  deleted_at_millis: PersistedMillis,
});

const TodoRowSchema = Schema.Union(
  ActiveTodoRow,
  CompletedTodoRow,
  DeletedTodoRow,
);

// 목록 쿼리는 삭제되지 않은 Todo만 반환한다는 별도의 read contract를 가진다.
const ListedTodoRowSchema = Schema.Union(ActiveTodoRow, CompletedTodoRow);
type ListedTodoRow = Schema.Schema.Type<typeof ListedTodoRowSchema>;

const toStorageError = (operation: string) => (error: unknown) =>
  new StorageError({
    operation,
    message:
      error instanceof Error
        ? error.message
        : ParseResult.TreeFormatter.formatErrorSync(error as ParseResult.ParseError),
  });

const decodeTodoRow = (operation: string, input: unknown) =>
  // SQLite가 준 row는 신뢰할 수 없다. 안전한 persistence row 타입으로 바꾸는 경계다.
  Schema.decodeUnknown(TodoRowSchema)(input).pipe(
    Effect.mapError(toStorageError(operation)),
  );

export const todoFromRow = (input: unknown): Effect.Effect<Todo, StorageError> =>
  decodeTodoRow("decode todo row", input).pipe(
    Effect.flatMap((row) => {
      const todo: Todo = (() => {
        switch (row.status) {
          case "active":
            return {
              _tag: "ActiveTodo",
              id: row.id,
              title: row.title,
              createdAtMillis: epochMillisFromNumber(row.created_at_millis),
            };
          case "completed":
            return {
              _tag: "CompletedTodo",
              id: row.id,
              title: row.title,
              createdAtMillis: epochMillisFromNumber(row.created_at_millis),
              completedAtMillis: epochMillisFromNumber(row.completed_at_millis),
            };
          case "deleted":
            return {
              _tag: "DeletedTodo",
              id: row.id,
              title: row.title,
              createdAtMillis: epochMillisFromNumber(row.created_at_millis),
              deletedAtMillis: epochMillisFromNumber(row.deleted_at_millis),
            };
        }
      })();

      return Schema.decodeUnknown(Todo)(todo).pipe(
        Effect.mapError(toStorageError("decode Todo domain value")),
      );
    }),
  );

const requireTag = <A extends Todo["_tag"]>(tag: A, operation: string) =>
  (todo: Todo): Effect.Effect<Extract<Todo, { readonly _tag: A }>, StorageError> =>
    todo._tag === tag
      ? Effect.succeed(todo as Extract<Todo, { readonly _tag: A }>)
      : Effect.fail(
          new StorageError({
            operation,
            message: `Expected ${tag} row, received ${todo._tag}.`,
          }),
        );

export const completedTodoFromRow = (input: unknown) =>
  todoFromRow(input).pipe(Effect.flatMap(requireTag("CompletedTodo", "decode completed todo row")));

export const deletedTodoFromRow = (input: unknown) =>
  todoFromRow(input).pipe(Effect.flatMap(requireTag("DeletedTodo", "decode deleted todo row")));

const toListedTodo = (row: ListedTodoRow): ListedTodo => {
  switch (row.status) {
    case "active":
      return {
        _tag: "ActiveTodo",
        id: row.id,
        title: row.title,
        createdAtMillis: epochMillisFromNumber(row.created_at_millis),
      };
    case "completed":
      return {
        _tag: "CompletedTodo",
        id: row.id,
        title: row.title,
        createdAtMillis: epochMillisFromNumber(row.created_at_millis),
        completedAtMillis: epochMillisFromNumber(row.completed_at_millis),
      };
  }
};

export const listedTodosFromRows = (
  rows: ReadonlyArray<unknown>,
): Effect.Effect<ReadonlyArray<ListedTodo>, StorageError> =>
  Effect.all(
    rows.map((row) =>
      Schema.decodeUnknown(ListedTodoRowSchema)(row).pipe(
        Effect.mapError(toStorageError("decode listed todo row")),
        Effect.map(toListedTodo),
      ),
    ),
  );
