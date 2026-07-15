import { HttpServerResponse } from "@effect/platform";
import { Data, Match } from "effect";
import {
  InvalidTodoId,
  InvalidTodoTitle,
  TodoAlreadyCompleted,
} from "../../domain/error";
import { StorageError, TodoNotFound } from "../../services/errors";

export type ErrorResponseDto = {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  };
};

/**
 * The HTTP adapter owns this error. Parser failures from @effect/platform and
 * Schema are normalized here instead of leaking into the public error model.
 */
export class InvalidHttpRequest extends Data.TaggedError("InvalidHttpRequest") {}

/**
 * Every expected failure this adapter is allowed to render. A new member makes
 * Match.tagsExhaustive fail to type-check until its HTTP representation exists.
 */
export type ExpectedHttpError =
  | InvalidHttpRequest
  | InvalidTodoTitle
  | InvalidTodoId
  | TodoAlreadyCompleted
  | TodoNotFound
  | StorageError;

type ErrorMapping = {
  readonly status: number;
  readonly code: string;
  readonly message: string;
};

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
