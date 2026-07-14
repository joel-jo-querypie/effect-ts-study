import { Effect, Layer, Ref } from "effect";
import type { TodoEvent } from "../domain/todo-event";
import { RequestContext } from "../services/request-context";
import { TodoEventStore } from "../services/todo-event-store";

export const InMemoryTodoEventStoreLive = Layer.effect(
  TodoEventStore,
  Effect.gen(function* () {
    const events = yield* Ref.make<ReadonlyArray<TodoEvent>>([]);

    return TodoEventStore.of({
      append: (event) =>
        Effect.gen(function* () {
          yield* RequestContext;
          yield* Ref.update(events, (current) => [...current, event]);
          return event;
        }),
    });
  }),
);
