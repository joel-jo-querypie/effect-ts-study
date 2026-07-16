import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { Effect } from "effect";
import { requestContextLayer } from "../../layers";
import { addTodo, deleteTodo, doneTodo, listTodos } from "../../programs";
import {
  CreateTodoRequestDto,
  ListTodosRequestDto,
  TodoIdPathRequestDto,
  requestContextFromHeaders,
} from "./request";
import {
  toDeletedTodoResponseDto,
  toListedTodoResponseDto,
  toTodoResponseDto,
} from "./response";
import {
  InvalidHttpRequest,
  type ExpectedHttpError,
  toErrorResponse,
} from "./errors";

const withExpectedHttpErrorResponse = <A, R>(
  requestId: string,
): ((
  effect: Effect.Effect<A, ExpectedHttpError, R>,
) => Effect.Effect<A | HttpServerResponse.HttpServerResponse, never, R>) =>
  Effect.catchAll((error) =>
    Effect.succeed(toErrorResponse(requestId, error)),
  );

// platform/schema가 내는 다양한 decode 오류를 adapter owned error InvalidHttpRequest 하나로 처리
const decodeHttpRequest = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
  effect.pipe(Effect.mapError(() => new InvalidHttpRequest()));

const requestContextFromCurrentRequest = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  return yield* requestContextFromHeaders({
    "x-request-id": request.headers["x-request-id"],
    "x-actor-id": request.headers["x-actor-id"],
  });
});

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
  const requestContext = yield* requestContextFromCurrentRequest;
  const request = yield* decodeHttpRequest(
    HttpRouter.schemaJson(CreateTodoRequestDto),
  ).pipe(withExpectedHttpErrorResponse(requestContext.requestId));

  if (HttpServerResponse.isServerResponse(request)) {
    return request;
  }

  const result = yield* addTodo(request.body.title).pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withExpectedHttpErrorResponse(requestContext.requestId),
  );

  if (HttpServerResponse.isServerResponse(result)) {
    return result;
  }

  return HttpServerResponse.unsafeJson(toTodoResponseDto(result), { status: 201 });
});

const listTodosHandler = Effect.gen(function* () {
  const requestContext = yield* requestContextFromCurrentRequest;
  const request = yield* decodeHttpRequest(
    HttpRouter.schemaNoBody(ListTodosRequestDto),
  ).pipe(withExpectedHttpErrorResponse(requestContext.requestId));

  if (HttpServerResponse.isServerResponse(request)) {
    return request;
  }

  // const result = yield* listTodos({
  //     limit: request.searchParams.limit ?? 50,
  //     offset: request.searchParams.offset ?? 0,
  //   }).pipe(

  const result = yield* listTodos(request.searchParams).pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withExpectedHttpErrorResponse(requestContext.requestId),
  );

  if (HttpServerResponse.isServerResponse(result)) {
    return result;
  }

  return HttpServerResponse.unsafeJson(
    {
      items: result.items.map(toListedTodoResponseDto),
      ...(result.nextOffset === undefined
        ? {}
        : { nextOffset: result.nextOffset }),
    },
    { status: 200 },
  );
});

const completeTodoHandler = Effect.gen(function* () {
  const requestContext = yield* requestContextFromCurrentRequest;
  // InvalidHttpRequest로 내보내지게.
  const request = yield* decodeHttpRequest(
    HttpRouter.schemaNoBody(TodoIdPathRequestDto),
  ).pipe(withExpectedHttpErrorResponse(requestContext.requestId));

  if (HttpServerResponse.isServerResponse(request)) {
    return request;
  }

  const result = yield* doneTodo(request.pathParams.id).pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withExpectedHttpErrorResponse(requestContext.requestId),
  );

  if (HttpServerResponse.isServerResponse(result)) {
    return result;
  }

  return HttpServerResponse.unsafeJson(toTodoResponseDto(result), { status: 200 });
});

const deleteTodoHandler = Effect.gen(function* () {
  const requestContext = yield* requestContextFromCurrentRequest;
  const request = yield* decodeHttpRequest(
    HttpRouter.schemaNoBody(TodoIdPathRequestDto),
  ).pipe(withExpectedHttpErrorResponse(requestContext.requestId));

  if (HttpServerResponse.isServerResponse(request)) {
    return request;
  }

  const result = yield* deleteTodo(request.pathParams.id).pipe(
    Effect.provide(requestContextLayer(requestContext)),
    withExpectedHttpErrorResponse(requestContext.requestId),
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
  HttpRouter.post("/todos/:id/complete", completeTodoHandler),
  HttpRouter.del("/todos/:id", deleteTodoHandler),
);
