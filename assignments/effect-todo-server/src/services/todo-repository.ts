import { Context, Effect } from "effect";
import type {
  ActiveTodo,
  CompletedTodo,
  DeletedTodo,
  ListedTodo,
} from "../domain/todo";
import type { EpochMillis } from "../domain/epoch-millis";
import type { TodoId } from "../domain/todo-id";
import { StorageError, TodoNotFound } from "./errors";
import type { PageRequest } from "./page-request";
import type { TodoAlreadyCompleted } from "../domain/error";

export type TodoPage = {
  readonly items: ReadonlyArray<ListedTodo>;
  readonly nextOffset?: number;
};

export class TodoRepository extends Context.Tag("TodoRepository")<
  TodoRepository,
  {
    readonly add: (todo: ActiveTodo) => Effect.Effect<ActiveTodo, StorageError>;
    readonly list: (
      page: PageRequest,
    ) => Effect.Effect<TodoPage, StorageError>;
    readonly markDone: (
      id: TodoId,
      /**
        프로그램(비즈니스로직)이 "이 일이 언제 일어났는지?"에 대한 정책을 갖게
        리포지토리는 조회와 영속성(저장) 역할을 해야하지 않을까
       */
      completedAtMillis: EpochMillis,
    ) => Effect.Effect<
      CompletedTodo,
      TodoNotFound | TodoAlreadyCompleted | StorageError
    >;
    readonly delete: (
      id: TodoId,
      deletedAtMillis: EpochMillis,
    ) => Effect.Effect<DeletedTodo, TodoNotFound | StorageError>;
  }
>() {}
