import { Effect, Schema } from "effect";
import {
  ActorId,
  RequestId,
  type RequestContextData,
} from "../../services/request-context";
import {
  PageRequest,
  defaultPageRequest,
} from "../../services/page-request";

// 클라이언트가 보내지 않아도 요청을 처리할 수 있는 정책으로 optional
export const HttpHeadersDto = Schema.Struct({
  "x-request-id": Schema.optional(RequestId),
  "x-actor-id": Schema.optional(ActorId),
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

const PageRequestSearchParams = Schema.Struct({
  limit: Schema.optional(Schema.NumberFromString),
  offset: Schema.optional(Schema.NumberFromString),
});

const PageRequestFromSearchParams = Schema.transform(
  PageRequestSearchParams,
  PageRequest,
  {
    decode: (searchParams) => ({
      limit: searchParams.limit ?? defaultPageRequest.limit,
      offset: searchParams.offset ?? defaultPageRequest.offset,
    }),
    encode: (page) => ({
      limit: page.limit,
      offset: page.offset,
    }),
  },
);

export const ListTodosRequestDto = Schema.Struct({
  headers: HttpHeadersDto,
  searchParams: PageRequestFromSearchParams,
});
export type ListTodosRequestDto = Schema.Schema.Type<typeof ListTodosRequestDto>;

// TODO: parse, dont't validate
export const requestContextFromHeaders = (
  headers: Readonly<Record<string, string | undefined>>,
): Effect.Effect<RequestContextData> =>
  Effect.sync(() => {
    const rawRequestId = headers["x-request-id"];
    const rawActorId = headers["x-actor-id"];
    const requestId =
      rawRequestId !== undefined && rawRequestId.length > 0 && rawRequestId.length <= 128
        ? RequestId.make(rawRequestId)
        : RequestId.make(globalThis.crypto.randomUUID());
    const actorId =
      rawActorId !== undefined && rawActorId.length > 0 && rawActorId.length <= 128
        ? ActorId.make(rawActorId)
        : undefined;

    return {
      requestId,
      ...(actorId === undefined ? {} : { actorId }),
    }
  });
