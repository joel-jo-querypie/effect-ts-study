import { Clock, Effect } from "effect";
import { makeActiveTodo } from "../domain/todo";
import { todoTitleFromString } from "../domain/todo-title";
import { TodoIdGenerator } from "../services/id-generator";
import { TodoImportSource } from "../services/todo-import-source";
import { TodoRepository } from "../services/todo-repository";

export const importTodos = (file: string) =>
  Effect.gen(function* () {
    const importSource = yield* TodoImportSource;
    const repository = yield* TodoRepository;
    const todoIdGenerator = yield* TodoIdGenerator;
    const titleLines = yield* importSource.readTitleLines(file);
    const todoTitles = yield* Effect.all(
      titleLines
        .filter((line) => line.trim().length > 0)
        .map(todoTitleFromString),
    );
    const createdAtMillis = yield* Clock.currentTimeMillis;
    const activeTodos = yield* Effect.all(
      todoTitles.map((title) =>
        todoIdGenerator.generate.pipe(
          Effect.map((id) => makeActiveTodo({ id, title, createdAtMillis })),
        ),
      ),
    );
    const savedTodos = yield* Effect.all(activeTodos.map(repository.add));

    return savedTodos;
  });
