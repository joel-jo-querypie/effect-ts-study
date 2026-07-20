import { Clock, Effect } from "effect";
import { epochMillisFromNumber } from "../domain/epoch-millis";
import { todoIdFromString } from "../domain/todo-id";
import { deleteTodo as transitionDeleteTodo } from "../domain/todo-transition";
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
        const currentTodo = yield* repository.find(id);
        const change = transitionDeleteTodo(currentTodo, deletedAtMillis);
        const deletedTodo = yield* repository.saveDeletedIfDeletable(change.todo);
        yield* eventStore.append(change.event);
        return deletedTodo;
      }),
    );
  });
