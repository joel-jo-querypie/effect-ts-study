import { Clock, Effect } from "effect";
import { makeTodoDeletedEvent } from "../domain/todo-event";
import { epochMillisFromNumber } from "../domain/epoch-millis";
import { todoIdFromString } from "../domain/todo-id";
import { AtomicRunner } from "../services/atomic-runner";
import { TodoEventStore } from "../services/todo-event-store";
import { TodoRepository } from "../services/todo-repository";

export const deleteTodo = (idInput: string) =>
  Effect.gen(function* () {
    const id = yield* todoIdFromString(idInput);
    const repository = yield* TodoRepository;
    const eventStore = yield* TodoEventStore;
    const atomicRunner = yield* AtomicRunner;
    const deletedAtMillis = epochMillisFromNumber(
      yield* Clock.currentTimeMillis,
    );

    return yield* atomicRunner.run(
      Effect.gen(function* () {
        const deletedTodo = yield* repository.delete(id, deletedAtMillis);
        yield* eventStore.append(
          makeTodoDeletedEvent({
            todoId: deletedTodo.id,
            titleSnapshot: deletedTodo.title,
            occurredAtMillis: deletedAtMillis,
          }),
        );
        return deletedTodo;
      }),
    );
  });
