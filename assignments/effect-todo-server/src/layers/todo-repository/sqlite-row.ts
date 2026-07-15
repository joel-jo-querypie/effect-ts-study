import { Effect, ParseResult, Schema } from "effect";
import { epochMillisFromNumber } from "../../domain/epoch-millis";
import { Todo, type ListedTodo } from "../../domain/todo";
import { StorageError } from "../../services/errors";

const PersistedMillis = Schema.Number.pipe(Schema.int(), Schema.nonNegative());

const ActiveTodoRow = Schema.Struct({
  id: Schema.UUID,
  title: Schema.String,
  status: Schema.Literal("active"),
  created_at_millis: PersistedMillis,
  completed_at_millis: Schema.Null,
  deleted_at_millis: Schema.Null,
});

const CompletedTodoRow = Schema.Struct({
  id: Schema.UUID,
  title: Schema.String,
  status: Schema.Literal("completed"),
  created_at_millis: PersistedMillis,
  completed_at_millis: PersistedMillis,
  deleted_at_millis: Schema.Null,
});

const DeletedTodoRow = Schema.Struct({
  id: Schema.UUID,
  title: Schema.String,
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
const toStorageError = (operation: string) => (error: unknown) =>
  new StorageError({
    operation,
    message:
      error instanceof Error
        ? error.message
        : ParseResult.TreeFormatter.formatErrorSync(error as ParseResult.ParseError),
  });

const decodeTodoRow = (operation: string, input: unknown) =>
  Schema.decodeUnknown(TodoRowSchema)(input).pipe(
    Effect.mapError(toStorageError(operation)),
  );

export const todoFromRow = (input: unknown): Effect.Effect<Todo, StorageError> =>
  decodeTodoRow("decode todo row", input).pipe(
    Effect.flatMap((row) => {
      const todo = (() => {
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

export const listedTodosFromRows = (
  rows: ReadonlyArray<unknown>,
): Effect.Effect<ReadonlyArray<ListedTodo>, StorageError> =>
  Effect.all(rows.map(todoFromRow)).pipe(
    Effect.map((todos) =>
      todos.filter((todo): todo is ListedTodo => todo._tag !== "DeletedTodo"),
    ),
  );
