import { Clock, Effect, Random, Schema } from "effect";
import type { RequestContextData } from "../../services/request-context";

// 클라이언트가 보내지 않아도 요청을 처리할 수 있는 정책으로 optional
export const HttpHeadersDto = Schema.Struct({
  "x-request-id": Schema.optional(Schema.String),
  "x-actor-id": Schema.optional(Schema.String),
});
export type HttpHeadersDto = Schema.Schema.Type<typeof HttpHeadersDto>;

// CreateTodoRequestDto
export const CreateTodoRequestDto = Schema.Struct({
  headers: HttpHeadersDto,
  body: Schema.Struct({
    title: Schema.String,
  }),
});
export type CreateTodoRequestDto = Schema.Schema.Type<
  typeof CreateTodoRequestDto
>;

// TodoIdPathRequestDto
export const TodoIdPathRequestDto = Schema.Struct({
  headers: HttpHeadersDto,
  pathParams: Schema.Struct({
    id: Schema.String,
  }),
});
export type TodoIdPathRequestDto = Schema.Schema.Type<
  typeof TodoIdPathRequestDto
>;

// ListTodosRequestDto
export const ListTodosRequestDto = Schema.Struct({
  headers: HttpHeadersDto,
});
export type ListTodosRequestDto = Schema.Schema.Type<typeof ListTodosRequestDto>;

export const requestContextFromHeaders = (
  headers: HttpHeadersDto,
): Effect.Effect<RequestContextData> =>
  Effect.gen(function* () {
    if (headers["x-request-id"] !== undefined) {
      return {
        requestId: headers["x-request-id"],
        actorId: headers?.["x-actor-id"],
      };
    }

    const now = yield* Clock.currentTimeMillis;
    const suffix = yield* Random.nextIntBetween(100_000, 999_999);
    return {
      requestId: `req-${now}-${suffix}`,
      actorId: headers["x-actor-id"],
    };
  });
