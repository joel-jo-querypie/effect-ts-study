import { Layer } from "effect"
import { FileTodoRepositoryLive } from "./file-todo-repository"
import { FileTodoImportSourceLive } from "./file-todo-import-source"
import { InMemoryTodoRepositoryLive } from "./in-memory-todo-repository"
import { RandomTodoIdGeneratorLive } from "./id-generator"

export const FileAppLive = Layer.mergeAll(
  FileTodoRepositoryLive,
  FileTodoImportSourceLive,
  RandomTodoIdGeneratorLive
)

export const InMemoryAppLive = Layer.mergeAll(
  InMemoryTodoRepositoryLive,
  FileTodoImportSourceLive,
  RandomTodoIdGeneratorLive
)

export {
  FileTodoRepositoryLive,
  InMemoryTodoRepositoryLive,
  RandomTodoIdGeneratorLive
}
