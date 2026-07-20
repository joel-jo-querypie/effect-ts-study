import { Context, Effect } from "effect";
import type {
  ActiveTodo,
  CompletedTodo,
  DeletableTodo,
  DeletedTodo,
  ListedTodo,
} from "../domain/todo";
import type { TodoId } from "../domain/todo-id";
import { StorageError, TodoNotFound } from "./errors";
import type { PageRequest } from "./page-request";
import type { TodoAlreadyCompleted } from "../domain/error";

export type TodoPage = {
  readonly items: ReadonlyArray<ListedTodo>;
  readonly nextOffset?: number;
};

// data source를 모르게하는
export class TodoRepository extends Context.Tag("TodoRepository")<
  TodoRepository,
  {
    readonly add: (todo: ActiveTodo) => Effect.Effect<ActiveTodo, StorageError>;
    readonly list: (
      page: PageRequest,
    ) => Effect.Effect<TodoPage, StorageError>;
    readonly find: (
      id: TodoId,
    ) => Effect.Effect<DeletableTodo, TodoNotFound | StorageError>;
    readonly saveCompletedIfActive: (
      todo: CompletedTodo,
    ) => Effect.Effect<
      CompletedTodo,
      TodoNotFound | TodoAlreadyCompleted | StorageError
    >;
    readonly saveDeletedIfDeletable: (
      todo: DeletedTodo,
    ) => Effect.Effect<DeletedTodo, TodoNotFound | StorageError>;
  }
>() {}
