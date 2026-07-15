import { Effect } from "effect"
import {
  TodoRepository,
  type ListTodosOptions,
} from "../services/todo-repository"

export const defaultListTodosOptions: ListTodosOptions = {
  limit: 50,
  offset: 0,
}

export const listTodos = (options = defaultListTodosOptions) => Effect.gen(function* () {
  const repository = yield* TodoRepository
  return yield* repository.list(options)
})
