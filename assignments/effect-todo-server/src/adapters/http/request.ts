import { Either, Effect, Schema } from "effect";
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

// HTTP query string은 신뢰할 수 없는 문자열이다. 여기서 application query
// value로 파싱하여 TodoRepository의 모든 호출자가 PageRequest만 받게 한다.
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

const generatedRequestId = (): RequestId =>
  Schema.decodeUnknownSync(RequestId)(globalThis.crypto.randomUUID());

/**
 * 전체 HTTP DTO를 decode하기 전에 실행하여, 오류 응답에도 항상 correlation ID를
 * 넣을 수 있게 한다. Either로 RequestId/ActorId 규칙을 중복하지 않고, 유효한 값은
 * 사용하며 없거나 잘못된 값은 여기서 fallback한다. 잘못 보낸 헤더 자체는 이후
 * HttpHeadersDto decode가 여전히 400 응답으로 거절한다.
 */
export const requestContextFromHeaders = (
  headers: Readonly<Record<string, string | undefined>>,
): Effect.Effect<RequestContextData> =>
  /**
   * sync 이는 typed error를 내보내기 위해서가 아니라, UUID 생성과 context 조립을 Effect 실행 시점으로 미루고 router의 Effect.gen 흐름 안에서 합성하려는 것입니다.
   * 이 함수에서 ParseError를 typed failure로 만들지 않은 것은 의도적입니다.
   * 실제 HTTP 요청의 유효성 판정은 뒤의 HttpHeadersDto decode가 맡아 InvalidHttpRequest -> 400으로 처리합니다.
   */
  Effect.sync(() => {
    // 파싱 실패를 즉시 Effect 실패로 올리지 않고, fallback 적용
    /**
     * Either.getOrElse: Right면 그 값을 쓰고, Left면 제공한 fallback 함수를 실행해 값을 만든다.
     * Either.getOrUndefined: Right면 그 값을 쓰고, Left면 undefined를 반환한다.
     */
    const requestId = Either.getOrElse(
      Schema.decodeUnknownEither(RequestId)(headers["x-request-id"]),
      generatedRequestId, // x-request-id 헤더를 읽고, 없으면 UUID를 만들고, 잘못된 값에는 fallback하는 정책: HTTP adapter 책임
    );
    const actorId = Either.getOrUndefined(
      Schema.decodeUnknownEither(ActorId)(headers["x-actor-id"]),
    );

    return {
      requestId,
      ...(actorId === undefined ? {} : { actorId }),
    };
  });
