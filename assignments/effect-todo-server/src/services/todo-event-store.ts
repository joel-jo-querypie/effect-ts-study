import { Context, Effect } from "effect";
import type { TodoEvent } from "../domain/todo-event";
import type { StorageError } from "./errors";

export class TodoEventStore extends Context.Tag("TodoEventStore")<
  TodoEventStore,
  {
    readonly append: (
      event: TodoEvent,
    ) => Effect.Effect<TodoEvent, StorageError>;
  }
>() {}
