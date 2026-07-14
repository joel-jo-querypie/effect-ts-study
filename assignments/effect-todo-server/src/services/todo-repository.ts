import { Context, Effect } from "effect";
import type {
  ActiveTodo,
  CompletedTodo,
  DeletedTodo,
  ListedTodo,
} from "../domain/todo";
import type { TodoId } from "../domain/todo-id";
import { StorageError, TodoNotFound } from "./errors";

export class TodoRepository extends Context.Tag("TodoRepository")<
  TodoRepository,
  {
    readonly add: (todo: ActiveTodo) => Effect.Effect<ActiveTodo, StorageError>;
    readonly list: Effect.Effect<ReadonlyArray<ListedTodo>, StorageError>;
    readonly markDone: (
      id: TodoId,
      /**
        프로그램(비즈니스로직)이 "이 일이 언제 일어났는지?"에 대한 정책을 갖게
        리포지토리는 조회와 영속성(저장) 역할을 해야하지 않을까
       */
      completedAtMillis: number,
    ) => Effect.Effect<CompletedTodo, TodoNotFound | StorageError>;
    readonly delete: (
      id: TodoId,
      deletedAtMillis: number,
    ) => Effect.Effect<DeletedTodo, TodoNotFound | StorageError>;
  }
>() {}
