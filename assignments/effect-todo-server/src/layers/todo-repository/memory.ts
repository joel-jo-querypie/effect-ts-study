import { Effect, Layer, Ref } from "effect"
import {
  type ListedTodo,
  type Todo,
  type TodoList
} from "../../domain/todo"
import { TodoAlreadyCompleted } from "../../domain/error"
import { TodoNotFound } from "../../services/errors"
import { TodoRepository } from "../../services/todo-repository"

export const InMemoryTodoRepositoryLive = Layer.effect(
  TodoRepository,
  Effect.gen(function* () {
    const todos = yield* Ref.make<TodoList>([])

    const replaceAll = (next: ReadonlyArray<Todo>) =>
      Effect.gen(function* () {
        yield* Ref.set(todos, next)
        return next
      })

    return TodoRepository.of({
      add: (activeTodo) =>
        Effect.gen(function* () {
          const currentTodos = yield* Ref.get(todos)
          yield* replaceAll([...currentTodos, activeTodo])
          return activeTodo
        }),

      list: (options) =>
        Ref.get(todos).pipe(
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
          const currentTodos = yield* Ref.get(todos)
          const foundTodo = currentTodos.find((todo) => todo.id === id)

          if (foundTodo === undefined || foundTodo._tag === "DeletedTodo") {
            return yield* Effect.fail(new TodoNotFound({ id }))
          }

          return foundTodo
        }),

      saveCompletedIfActive: (completedTodo) =>
        Effect.gen(function* () {
          const currentTodos = yield* Ref.get(todos)
          const foundTodo = currentTodos.find((todo) => todo.id === completedTodo.id)

          if (foundTodo === undefined || foundTodo._tag === "DeletedTodo") {
            return yield* Effect.fail(new TodoNotFound({ id: completedTodo.id }))
          }

          if (foundTodo._tag === "CompletedTodo") {
            return yield* Effect.fail(new TodoAlreadyCompleted({ id: completedTodo.id }))
          }

          yield* replaceAll(
            currentTodos.map((todo) =>
              todo.id === completedTodo.id ? completedTodo : todo
            )
          )

          return completedTodo
        }),

      saveDeletedIfDeletable: (deletedTodo) =>
        Effect.gen(function* () {
          const currentTodos = yield* Ref.get(todos)
          const foundTodo = currentTodos.find((todo) => todo.id === deletedTodo.id)

          if (foundTodo === undefined || foundTodo._tag === "DeletedTodo") {
            return yield* Effect.fail(new TodoNotFound({ id: deletedTodo.id }))
          }

          yield* replaceAll(
            currentTodos.map((todo) =>
              todo.id === deletedTodo.id ? deletedTodo : todo
            )
          )

          return deletedTodo
        })
    })
  })
)

const filterListedTodos = (todos: ReadonlyArray<Todo>): ReadonlyArray<ListedTodo> =>
  todos.filter((todo): todo is ListedTodo => todo._tag !== "DeletedTodo")
