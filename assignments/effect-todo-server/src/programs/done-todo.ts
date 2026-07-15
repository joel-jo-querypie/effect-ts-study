import { Clock, Effect } from "effect";
import { makeTodoCompletedEvent } from "../domain/todo-event";
import { epochMillisFromNumber } from "../domain/epoch-millis";
import { todoIdFromString } from "../domain/todo-id";
import { AtomicRunner } from "../services/atomic-runner";
import { TodoEventStore } from "../services/todo-event-store";
import { TodoRepository } from "../services/todo-repository";

export const doneTodo = (idInput: string) =>
  Effect.gen(function* () {
    const id = yield* todoIdFromString(idInput);
    const repository = yield* TodoRepository;
    const eventStore = yield* TodoEventStore;
    const atomicRunner = yield* AtomicRunner;
    const completedAtMillis = epochMillisFromNumber(
      yield* Clock.currentTimeMillis,
    );

    return yield* atomicRunner.run(
      Effect.gen(function* () {
        const completedTodo = yield* repository.markDone(id, completedAtMillis);
        yield* eventStore.append(
          makeTodoCompletedEvent({
            todoId: completedTodo.id,
            occurredAtMillis: completedAtMillis,
          }),
        );
        return completedTodo;
      }),
    );
  });
