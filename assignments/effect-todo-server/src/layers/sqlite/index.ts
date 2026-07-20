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

/**
 * 에러를 숨기지 말아라.
 * 시스템 에러 치환하는 룰이 있을 것 이다.
 * 인프라 에러는 그대로 올리고, 어플리케이션 레벨에서 핸들링 한다.
 * application layer에서
 * 모든 레이어가 각자의 책임을 들고 있어야하는데 너무 타이트 함.
 */
