import { HttpServer } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";
import { Layer } from "effect";
import { todoHttpRouter } from "../adapters/http";
import {
  RandomTodoIdGeneratorLive,
  sqlitePersistenceLayerForFile,
} from "../layers";

/**
 * Normal development uses a local SQLite file. Tests and the curl E2E script
 * override this value so their writes never share a developer's database.
 */
const databaseFile =
  process.env.TODO_DATABASE_FILE ?? "effect-todo-server.sqlite";

/**
 * Keep the normal server runnable without configuration, while allowing an
 * isolated port for an E2E process or another local server instance.
 */
const port = Number(process.env.PORT ?? 3000);

/**
 * Concrete implementations required by the programs behind the HTTP router.
 *
 * - SQLite persistence provides TodoRepository, TodoEventStore, AtomicRunner,
 *   and creates the schema when the Layer is acquired.
 * - RandomTodoIdGeneratorLive provides the only non-persistence dependency
 *   needed by Todo creation.
 *
 * RequestContext is intentionally absent: the HTTP adapter creates it from
 * each request header and provides it only for that request.
 */
const TodoApplicationLive = Layer.mergeAll(
  sqlitePersistenceLayerForFile(databaseFile),
  RandomTodoIdGeneratorLive,
);

/**
 * The executable server composition.
 *
 * HttpServer.serve turns the transport-agnostic router into a Layer that
 * needs an HttpServer and the services required by its handlers. The first
 * provide supplies the Node HTTP implementation and starts listening on the
 * configured port. The second supplies the application implementations used
 * when a route calls a program.
 *
 * main.ts launches this Layer. Its Effect Scope owns both the HTTP server and
 * SQLite resources, so interrupting the process releases them together.
 */
export const TodoServerLive = HttpServer.serve(todoHttpRouter).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port })),
  Layer.provide(TodoApplicationLive),
);
