import { Layer } from "effect"
import { PassthroughAtomicRunnerLive } from "./atomic-runner"
import { FileTodoRepositoryLive } from "./file-todo-repository"
import { FileTodoImportSourceLive } from "./file-todo-import-source"
import { InMemoryTodoEventStoreLive } from "./in-memory-todo-event-store"
import { InMemoryTodoRepositoryLive } from "./in-memory-todo-repository"
import { RandomTodoIdGeneratorLive } from "./id-generator"

export const FileAppLive = Layer.mergeAll(
  FileTodoRepositoryLive,
  FileTodoImportSourceLive,
  InMemoryTodoEventStoreLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive
)

export const InMemoryAppLive = Layer.mergeAll(
  InMemoryTodoRepositoryLive,
  FileTodoImportSourceLive,
  InMemoryTodoEventStoreLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive
)

export {
  FileTodoRepositoryLive,
  InMemoryTodoEventStoreLive,
  InMemoryTodoRepositoryLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive
}
