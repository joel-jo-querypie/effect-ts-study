import { SqliteClient } from "@effect/sql-sqlite-node";
import { Layer } from "effect";
import { SqliteAtomicRunnerLive } from "../atomic-runner/sqlite";
import { SqliteSchemaLive } from "./schema";
import { SqliteTodoEventStoreLive } from "../todo-event-store/sqlite";
import { SqliteTodoRepositoryLive } from "../todo-repository/sqlite";

export { SqliteAtomicRunnerLive } from "../atomic-runner/sqlite";
export { SqliteSchemaLive } from "./schema";
export { SqliteTodoEventStoreLive } from "../todo-event-store/sqlite";
export { SqliteTodoRepositoryLive } from "../todo-repository/sqlite";

export const sqliteClientLayer = (filename: string) =>
  SqliteClient.layer({ filename });

export const sqlitePersistenceLayer = Layer.mergeAll(
  SqliteSchemaLive,
  SqliteTodoRepositoryLive,
  SqliteTodoEventStoreLive,
  SqliteAtomicRunnerLive,
);

export const sqlitePersistenceLayerForFile = (filename: string) =>
  sqlitePersistenceLayer.pipe(Layer.provide(sqliteClientLayer(filename)));
