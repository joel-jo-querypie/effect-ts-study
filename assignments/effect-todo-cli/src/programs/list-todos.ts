import { Effect } from "effect"
import { TodoRepository } from "../services/todo-repository"

export const listTodos = Effect.gen(function* () {
  const repository = yield* TodoRepository
  return yield* repository.list
})
