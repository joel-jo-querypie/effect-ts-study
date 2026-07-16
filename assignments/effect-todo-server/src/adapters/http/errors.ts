import { HttpServerResponse } from "@effect/platform";
import { Data, Match } from "effect";
import {
  InvalidTodoId,
  InvalidTodoTitle,
  TodoAlreadyCompleted,
} from "../../domain/error";
import {
  AtomicRunnerFailure,
  StorageError,
  TodoNotFound,
} from "../../services/errors";

export type ErrorResponseDto = {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  };
};

export class InvalidHttpRequest extends Data.TaggedError("InvalidHttpRequest") {}

export type ExpectedHttpError =
  | InvalidHttpRequest
  | InvalidTodoTitle
  | InvalidTodoId
  | TodoAlreadyCompleted
  | TodoNotFound
  | StorageError
  | AtomicRunnerFailure;

type ErrorMapping = {
  readonly status: number;
  readonly code: string;
  readonly message: string;
};

/**
 * 1. 이 에러는 HTTP에서 어떤 의미인가? -> errorMapping. 만일 INVALID_TODO_ID
   2. 그 의미를 어떤 HTTP 응답 형식으로 보낼 것인가? -> dto

   -TodoNotFound를 404 대신 410으로 바꾼다
   → ErrorMapping만 변경

   - 오류 응답에 traceId를 추가한다
   → DTO 조립 부분만 변경

   - StorageError.message에 SQL 상세가 있어도 외부에 노출하지 않는다
   → mapping에서 public message를 고정
 */
const errorMapping = Match.type<ExpectedHttpError>().pipe(
  Match.tagsExhaustive({
    InvalidHttpRequest: (): ErrorMapping => ({
      status: 400,
      code: "INVALID_HTTP_REQUEST",
      message: "HTTP request could not be decoded.",
    }),
    InvalidTodoTitle: (): ErrorMapping => ({
      status: 400,
      code: "INVALID_TODO_TITLE",
      message: "Todo title is invalid.",
    }),
    InvalidTodoId: (): ErrorMapping => ({
      status: 400,
      code: "INVALID_TODO_ID",
      message: "Todo id is invalid.",
    }),
    TodoAlreadyCompleted: (): ErrorMapping => ({
      status: 409,
      code: "TODO_ALREADY_COMPLETED",
      message: "Todo is already completed.",
    }),
    TodoNotFound: (): ErrorMapping => ({
      status: 404,
      code: "TODO_NOT_FOUND",
      message: "Todo was not found.",
    }),
    StorageError: (): ErrorMapping => ({
      status: 500,
      code: "STORAGE_ERROR",
      message: "Todo storage failed.",
    }),
    AtomicRunnerFailure: (): ErrorMapping => ({
      status: 500,
      code: "ATOMIC_OPERATION_FAILED",
      message: "Todo change could not be completed atomically.",
    }),
  }),
);

export const toErrorResponse = (
  requestId: string,
  error: ExpectedHttpError,
): HttpServerResponse.HttpServerResponse => {
  const mapped = errorMapping(error);
  return HttpServerResponse.unsafeJson(
    {
      error: {
        code: mapped.code,
        message: mapped.message,
        requestId,
      },
    } satisfies ErrorResponseDto,
    { status: mapped.status },
  );
};
