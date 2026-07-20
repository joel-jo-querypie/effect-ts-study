import { Effect, Layer, Ref } from "effect"
import { toCompletedTodo, type Todo, type TodoList } from "../domain/todo"
import { TodoNotFound } from "../services/errors"
import { TodoRepository } from "../services/todo-repository"

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

      list: Ref.get(todos),

      markDone: (id, completedAtMillis) =>
        Effect.gen(function* () {
          const currentTodos = yield* Ref.get(todos)
          const foundTodo = currentTodos.find((todo) => todo.id === id)

          if (foundTodo === undefined) {
            return yield* Effect.fail(new TodoNotFound({ id }))
          }

          if (foundTodo._tag === "CompletedTodo") {
            return foundTodo
          }

          const completedTodo = toCompletedTodo(foundTodo, completedAtMillis)
          yield* replaceAll(
            currentTodos.map((todo) =>
              todo.id === id ? completedTodo : todo
            )
          )

          return completedTodo
        })
    })
  })
)
