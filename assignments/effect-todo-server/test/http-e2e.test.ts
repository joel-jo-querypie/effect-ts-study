import {
  HttpClient,
  HttpClientRequest,
  HttpServer,
} from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import { SqlClient } from "@effect/sql";
import { expect, it } from "@effect/vitest";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { todoHttpRouter } from "../src/adapters/http";
import {
  RandomTodoIdGeneratorLive,
  sqliteClientLayer,
  sqlitePersistenceLayer,
} from "../src/layers";

type TodoResponse = {
  readonly id: string;
  readonly status: "active" | "completed" | "deleted";
};

type ErrorResponse = {
  readonly error: {
    readonly code: string;
    readonly requestId: string;
  };
};

type AuditLogRow = {
  readonly request_id: string;
  readonly action: string;
};

let nextDbId = 0;

const makeDbFile = () =>
  join(tmpdir(), `effect-todo-http-e2e-${Date.now()}-${nextDbId++}.sqlite`);

it.effect("serves the Todo lifecycle and standard decode errors", () => {
  const dbFile = makeDbFile();
  const SqliteLive = Layer.provideMerge(
    sqlitePersistenceLayer,
    sqliteClientLayer(dbFile),
  );
  const TestLive = Layer.mergeAll(
    NodeHttpServer.layerTest,
    SqliteLive,
    RandomTodoIdGeneratorLive,
  );

  return Effect.scoped(
    Effect.gen(function* () {
      yield* HttpServer.serveEffect(todoHttpRouter);

      const createResponse = yield* HttpClient.execute(
        HttpClientRequest.post("/todos").pipe(
          HttpClientRequest.setHeaders({
            "x-request-id": "http-e2e-create",
            "x-actor-id": "http-e2e-actor",
          }),
          HttpClientRequest.bodyUnsafeJson({ title: "exercise HTTP boundary" }),
        ),
      );
      const created = (yield* createResponse.json) as TodoResponse;

      expect(createResponse.status).toBe(201);
      expect(created.status).toBe("active");

      const completeResponse = yield* HttpClient.execute(
        HttpClientRequest.post(`/todos/${created.id}/complete`).pipe(
          HttpClientRequest.setHeader("x-request-id", "http-e2e-complete"),
        ),
      );
      const completed = (yield* completeResponse.json) as TodoResponse;

      expect(completeResponse.status).toBe(200);
      expect(completed.status).toBe("completed");

      const deleteResponse = yield* HttpClient.execute(
        HttpClientRequest.del(`/todos/${created.id}`).pipe(
          HttpClientRequest.setHeader("x-request-id", "http-e2e-delete"),
        ),
      );
      const deleted = (yield* deleteResponse.json) as TodoResponse;

      expect(deleteResponse.status).toBe(200);
      expect(deleted.status).toBe("deleted");

      const listResponse = yield* HttpClient.get("/todos");
      const listed = (yield* listResponse.json) as ReadonlyArray<TodoResponse>;

      expect(listResponse.status).toBe(200);
      expect(listed).toEqual([]);

      const malformedResponse = yield* HttpClient.execute(
        HttpClientRequest.post("/todos").pipe(
          HttpClientRequest.setHeader("x-request-id", "http-e2e-malformed"),
          HttpClientRequest.bodyText('{"title":', "application/json"),
        ),
      );
      const malformed = (yield* malformedResponse.json) as ErrorResponse;

      expect(malformedResponse.status).toBe(400);
      expect(malformed.error.code).toBe("INVALID_HTTP_REQUEST");
      expect(malformed.error.requestId).toBe("http-e2e-malformed");

      const sql = yield* SqlClient.SqlClient;
      const auditLogs = yield* sql<AuditLogRow>`
        SELECT request_id, action
        FROM audit_logs
        ORDER BY id
      `;

      expect(auditLogs).toEqual([
        { request_id: "http-e2e-create", action: "CreateTodo" },
        { request_id: "http-e2e-complete", action: "CompleteTodo" },
        { request_id: "http-e2e-delete", action: "DeleteTodo" },
      ]);
    }),
  ).pipe(
    Effect.provide(TestLive),
    Effect.ensuring(Effect.sync(() => rmSync(dbFile, { force: true }))),
  );
});
