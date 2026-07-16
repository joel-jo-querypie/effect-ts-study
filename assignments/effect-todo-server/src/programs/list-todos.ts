import { Effect } from "effect"
import {
  TodoRepository,
} from "../services/todo-repository"
import {
  defaultPageRequest,
  type PageRequest,
} from "../services/page-request"

export const listTodos = (page: PageRequest = defaultPageRequest) => Effect.gen(function* () {
  const repository = yield* TodoRepository
  return yield* repository.list(page)
})
