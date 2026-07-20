import { FileSystem } from "@effect/platform";
import { Effect, Layer, ParseResult, Schema } from "effect";
import {
  TodoList,
  type ListedTodo,
  type Todo,
  type TodoList as TodoListType,
} from "../../domain/todo";
import { TodoAlreadyCompleted } from "../../domain/error";
import { StorageError, TodoNotFound } from "../../services/errors";
import { TodoRepository } from "../../services/todo-repository";

const todoFile = "todo-list.json";

const toStorageError = (operation: string) => (cause: unknown) =>
  new StorageError({
    operation,
    message: String(cause),
  });

export const FileTodoRepositoryLive = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const file = todoFile;

    const readAll: Effect.Effect<TodoListType, StorageError> = Effect.gen(
      function* () {
        const exists = yield* fs
          .exists(file)
          .pipe(Effect.mapError(toStorageError("check todo file")));

        if (!exists) {
          return [];
        }

        const text = yield* fs
          .readFileString(file)
          .pipe(Effect.mapError(toStorageError("read todo file")));
        return yield* parseTodoFileText(text);
      },
    );

    const writeAll = (todos: ReadonlyArray<Todo>) =>
      Effect.gen(function* () {
        // readonly 지만 경계에서는 schema를 통과시키는게?
        const valid = yield* validateTodoFileData(todos);
        yield* fs
          .writeFileString(file, JSON.stringify(valid, null, 2))
          .pipe(Effect.mapError(toStorageError("write todo file")));
        return valid;
      });

    return TodoRepository.of({
      add: (activeTodo) =>
        Effect.gen(function* () {
          const currentTodos = yield* readAll;
          yield* writeAll([...currentTodos, activeTodo]);
          return activeTodo;
        }),

      list: (options) =>
        readAll.pipe(
          Effect.map(filterListedTodos),
          Effect.map((items) => ({
            items: items.slice(options.offset, options.offset + options.limit),
            ...(items.length > options.offset + options.limit
              ? { nextOffset: options.offset + options.limit }
              : {}),
          })),
        ),

      find: (id) =>
        Effect.gen(function* () {
          const currentTodos = yield* readAll;
          const foundTodo = currentTodos.find((todo) => todo.id === id);

          if (foundTodo === undefined || foundTodo._tag === "DeletedTodo") {
            return yield* Effect.fail(new TodoNotFound({ id }));
          }

          return foundTodo;
        }),

      saveCompletedIfActive: (completedTodo) =>
        Effect.gen(function* () {
          const currentTodos = yield* readAll;
          const foundTodo = currentTodos.find(
            (todo) => todo.id === completedTodo.id,
          );

          if (foundTodo === undefined || foundTodo._tag === "DeletedTodo") {
            return yield* Effect.fail(new TodoNotFound({ id: completedTodo.id }));
          }

          if (foundTodo._tag === "CompletedTodo") {
            return yield* Effect.fail(
              new TodoAlreadyCompleted({ id: completedTodo.id }),
            );
          }

          yield* writeAll(
            currentTodos.map((todo) =>
              todo.id === completedTodo.id ? completedTodo : todo,
            ),
          );

          return completedTodo;
        }),

      saveDeletedIfDeletable: (deletedTodo) =>
        Effect.gen(function* () {
          const currentTodos = yield* readAll;
          const foundTodo = currentTodos.find(
            (todo) => todo.id === deletedTodo.id,
          );

          if (foundTodo === undefined || foundTodo._tag === "DeletedTodo") {
            return yield* Effect.fail(new TodoNotFound({ id: deletedTodo.id }));
          }

          yield* writeAll(
            currentTodos.map((todo) =>
              todo.id === deletedTodo.id ? deletedTodo : todo,
            ),
          );

          return deletedTodo;
        }),
    });
  }),
);

// ------------------------------------------- helper --------------------------------
//

const fileDataError = (operation: string, message: string) =>
  new StorageError({ operation, message });

const decodeTodoFileData = (
  input: unknown,
): Effect.Effect<TodoListType, StorageError> =>
  Schema.decodeUnknown(TodoList)(input).pipe(
    Effect.mapError((error) =>
      fileDataError(
        "decode todo file",
        ParseResult.TreeFormatter.formatErrorSync(error),
      ),
    ),
  );

const parseTodoFileText = (
  text: string,
): Effect.Effect<TodoListType, StorageError> =>
  Effect.try({
    try: () => JSON.parse(text) as unknown,
    catch: (cause) => fileDataError("parse todo file", String(cause)),
  }).pipe(Effect.flatMap(decodeTodoFileData));

const validateTodoFileData = (
  todos: ReadonlyArray<Todo>,
): Effect.Effect<TodoListType, StorageError> => decodeTodoFileData(todos);

const filterListedTodos = (todos: ReadonlyArray<Todo>): ReadonlyArray<ListedTodo> =>
  todos.filter((todo): todo is ListedTodo => todo._tag !== "DeletedTodo");
