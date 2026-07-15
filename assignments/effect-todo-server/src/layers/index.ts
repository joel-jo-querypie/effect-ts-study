import { Layer } from "effect"
import { PassthroughAtomicRunnerLive } from "./atomic-runner/passthrough"
import { SqliteAtomicRunnerLive } from "./atomic-runner/sqlite"
import { RandomTodoIdGeneratorLive } from "./id-generator/random"
import { CliRequestContextLive, requestContextLayer } from "./request-context/from-value"
import {
  sqliteClientLayer,
  sqlitePersistenceLayer,
  sqlitePersistenceLayerForFile,
  SqliteSchemaLive
} from "./sqlite"
import { FileTodoImportSourceLive } from "./todo-import-source/file"
import { InMemoryTodoEventStoreLive } from "./todo-event-store/memory"
import { SqliteTodoEventStoreLive } from "./todo-event-store/sqlite"
import { FileTodoRepositoryLive } from "./todo-repository/file"
import { InMemoryTodoRepositoryLive } from "./todo-repository/memory"
import { SqliteTodoRepositoryLive } from "./todo-repository/sqlite"

export const FileAppLive = Layer.mergeAll(
  FileTodoRepositoryLive,
  FileTodoImportSourceLive,
  InMemoryTodoEventStoreLive,
  PassthroughAtomicRunnerLive,
  CliRequestContextLive,
  RandomTodoIdGeneratorLive
)

export const InMemoryAppLive = Layer.mergeAll(
  InMemoryTodoRepositoryLive,
  FileTodoImportSourceLive,
  InMemoryTodoEventStoreLive,
  PassthroughAtomicRunnerLive,
  CliRequestContextLive,
  RandomTodoIdGeneratorLive
)

export {
  FileTodoRepositoryLive,
  InMemoryTodoEventStoreLive,
  InMemoryTodoRepositoryLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive,
  CliRequestContextLive,
  requestContextLayer,
  sqliteClientLayer,
  sqlitePersistenceLayer,
  sqlitePersistenceLayerForFile,
  SqliteAtomicRunnerLive,
  SqliteSchemaLive,
  SqliteTodoEventStoreLive,
  SqliteTodoRepositoryLive
}
