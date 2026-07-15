import { Effect, ParseResult, Schema } from "effect";
import {
  CompletedTodo,
  DeletedTodo,
  Todo,
  type ListedTodo,
} from "../../domain/todo";
import { StorageError } from "../../services/errors";

export type TodoRow = {
  readonly id: string;
  readonly title: string;
  readonly status: "active" | "blocked" | "completed" | "deleted";
  readonly created_at_millis: number;
  readonly blocked_reason: string | null;
  readonly blocked_at_millis: number | null;
  readonly completed_at_millis: number | null;
  readonly deleted_at_millis: number | null;
};

const decodeTodo = (operation: string, input: unknown) =>
  Schema.decodeUnknown(Todo)(input).pipe(
    Effect.mapError((error) =>
      new StorageError({
        operation,
        message: ParseResult.TreeFormatter.formatErrorSync(error),
      }),
    ),
  );

const decodeCompletedTodo = (operation: string, input: unknown) =>
  Schema.decodeUnknown(CompletedTodo)(input).pipe(
    Effect.mapError((error) =>
      new StorageError({
        operation,
        message: ParseResult.TreeFormatter.formatErrorSync(error),
      }),
    ),
  );

const decodeDeletedTodo = (operation: string, input: unknown) =>
  Schema.decodeUnknown(DeletedTodo)(input).pipe(
    Effect.mapError((error) =>
      new StorageError({
        operation,
        message: ParseResult.TreeFormatter.formatErrorSync(error),
      }),
    ),
  );

export const todoFromRow = (row: TodoRow) => {
  switch (row.status) {
    case "active":
      return decodeTodo("decode active todo row", {
        _tag: "ActiveTodo",
        id: row.id,
        title: row.title,
        createdAtMillis: row.created_at_millis,
      });
    case "blocked":
      return decodeTodo("decode blocked todo row", {
        _tag: "BlockedTodo",
        id: row.id,
        title: row.title,
        createdAtMillis: row.created_at_millis,
        blockedReason: row.blocked_reason ?? "",
        blockedAtMillis: row.blocked_at_millis ?? 0,
      });
    case "completed":
      return decodeTodo("decode completed todo row", {
        _tag: "CompletedTodo",
        id: row.id,
        title: row.title,
        createdAtMillis: row.created_at_millis,
        completedAtMillis: row.completed_at_millis ?? 0, // TODO: 확인하기
      });
    case "deleted":
      return decodeTodo("decode deleted todo row", {
        _tag: "DeletedTodo",
        id: row.id,
        title: row.title,
        createdAtMillis: row.created_at_millis,
        deletedAtMillis: row.deleted_at_millis ?? 0,
      });
  }
};

export const listedTodosFromRows = (
  rows: ReadonlyArray<TodoRow>,
): Effect.Effect<ReadonlyArray<ListedTodo>, StorageError> =>
  Effect.all(rows.map(todoFromRow)) as Effect.Effect<
    ReadonlyArray<ListedTodo>,
    StorageError
  >;

export const completedTodoFromRow = (row: TodoRow) =>
  decodeCompletedTodo("decode completed todo row", {
    _tag: "CompletedTodo",
    id: row.id,
    title: row.title,
    createdAtMillis: row.created_at_millis,
    completedAtMillis: row.completed_at_millis ?? 0, // TODO: 확인하기
  });

export const deletedTodoFromRow = (row: TodoRow) =>
  decodeDeletedTodo("decode deleted todo row", {
    _tag: "DeletedTodo",
    id: row.id,
    title: row.title,
    createdAtMillis: row.created_at_millis,
    deletedAtMillis: row.deleted_at_millis ?? 0,
  });
