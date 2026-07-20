import { Clock, Effect } from "effect";
import { todoIdFromString } from "../domain/todo-id";
import { TodoRepository } from "../services/todo-repository";

export const doneTodo = (idInput: string) =>
  Effect.gen(function* () {
    const id = yield* todoIdFromString(idInput);
    const repository = yield* TodoRepository;
    const completedAtMillis = yield* Clock.currentTimeMillis;
    const completedTodo = yield* repository.markDone(id, completedAtMillis)

    return completedTodo;
  });
