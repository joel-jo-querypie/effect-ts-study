import { Context, Effect } from "effect";
import type { TodoId } from "../domain/todo-id";

export class TodoIdGenerator extends Context.Tag("TodoIdGenerator")<
  TodoIdGenerator,
  {
    readonly generate: Effect.Effect<TodoId>;
  }
>() {}
