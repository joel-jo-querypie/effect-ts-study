import { HttpRouter, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";
import { requestContextLayer } from "../../layers";
import { addTodo, deleteTodo, doneTodo, listTodos } from "../../programs";
import { requestContextFromHeaders } from "./request";
import {
  CreateTodoRequestDto,
  ListTodosRequestDto,
  TodoIdPathRequestDto,
} from "./request";
import {
  toDeletedTodoResponseDto,
  toListedTodoResponseDto,
  toTodoResponseDto,
} from "./response";
import { toErrorResponse } from "./errors";

const withHttpErrorResponse = <A, E, R>(
  requestId: string,
): ((
  effect: Effect.Effect<A, E, R>,
) => Effect.Effect<A | HttpServerResponse.HttpServerResponse, never, R>) =>
  Effect.catchAll((error) =>
    Effect.succeed(toErrorResponse(requestId, error)),
  );

const createTodoHandler = Effect.gen(function* () {
  /**
   * 실제 HTTP 요청의 headers/body/path params를 읽어,
   * DTO 모양으로 decode
   {
     headers: {
       "x-request-id"?: string
       "x-actor-id"?: string
     }
     body: {
       title: string
     }
   }
   */
  const request = yield* HttpRouter.schemaJson(CreateTodoRequestDto);
  const requestContext = yield* requestContextFromHeaders(request.headers);

  const result = yield* addTodo(request.body.title).pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withHttpErrorResponse(requestContext.requestId),
  );

  if (HttpServerResponse.isServerResponse(result)) {
    return result;
  }

  return HttpServerResponse.unsafeJson(toTodoResponseDto(result), { status: 201 });
});

const listTodosHandler = Effect.gen(function* () {
  const request = yield* HttpRouter.schemaNoBody(ListTodosRequestDto);
  const requestContext = yield* requestContextFromHeaders(request.headers);

  const result = yield* listTodos.pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withHttpErrorResponse(requestContext.requestId),
  );

  if (HttpServerResponse.isServerResponse(result)) {
    return result;
  }

  return HttpServerResponse.unsafeJson(result.map(toListedTodoResponseDto), {
    status: 200,
  });
});

const completeTodoHandler = Effect.gen(function* () {
  const request = yield* HttpRouter.schemaNoBody(TodoIdPathRequestDto);
  const requestContext = yield* requestContextFromHeaders(request.headers);

  const result = yield* doneTodo(request.pathParams.id).pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withHttpErrorResponse(requestContext.requestId),
  );

  if (HttpServerResponse.isServerResponse(result)) {
    return result;
  }

  return HttpServerResponse.unsafeJson(toTodoResponseDto(result), { status: 200 });
});

const deleteTodoHandler = Effect.gen(function* () {
  const request = yield* HttpRouter.schemaNoBody(TodoIdPathRequestDto);
  const requestContext = yield* requestContextFromHeaders(request.headers);

  const result = yield* deleteTodo(request.pathParams.id).pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withHttpErrorResponse(requestContext.requestId),
  );

  if (HttpServerResponse.isServerResponse(result)) {
    return result;
  }

  return HttpServerResponse.unsafeJson(toDeletedTodoResponseDto(result), {
    status: 200,
  });
});

export const todoHttpRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/todos", listTodosHandler),
  HttpRouter.post("/todos", createTodoHandler),
  HttpRouter.put("/todos/:id/done", completeTodoHandler),
  HttpRouter.del("/todos/:id", deleteTodoHandler),
);
