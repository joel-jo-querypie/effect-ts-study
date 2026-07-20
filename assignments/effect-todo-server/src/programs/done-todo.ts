import { Clock, Effect, Either } from "effect";
import { epochMillisFromNumber } from "../domain/epoch-millis";
import { todoIdFromString } from "../domain/todo-id";
import { completeTodo } from "../domain/todo-transition";
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
        const currentTodo = yield* repository.find(id);
        const transition = completeTodo(currentTodo, completedAtMillis);
        if (Either.isLeft(transition)) {
          return yield* Effect.fail(transition.left);
        }

        const change = transition.right;
        const completedTodo = yield* repository.saveCompletedIfActive(change.todo);
        yield* eventStore.append(change.event);
        return completedTodo;
      }),
    );
  });
