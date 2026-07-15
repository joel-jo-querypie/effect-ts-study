import { HttpServerResponse } from "@effect/platform";
import { ParseResult } from "effect";
import { InvalidTodoId, InvalidTodoTitle } from "../../domain/error";
import { StorageError, TodoNotFound } from "../../services/errors";

export type ErrorResponseDto = {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
  };
};

/** domain error와 errorResponseDto의 중간 역할
 * status는 JSON body의 데이터가 아니라 HTTP response 자체의 메타데이터
 * header의 상태는 404인데 body의 status가 실수로 500인 불일치 생길 수 있음
*/
type ErrorMapping = {
  readonly status: number;
  readonly code: string;
  readonly message: string;
};

const hasTag = (error: unknown): error is { readonly _tag: string } =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  typeof error._tag === "string";

const errorMapping = (error: unknown): ErrorMapping => {
  if (error instanceof InvalidTodoTitle) {
    return {
      status: 400,
      code: "INVALID_TODO_TITLE",
      message: "Todo title is invalid.",
    };
  }

  if (error instanceof InvalidTodoId) {
    return {
      status: 400,
      code: "INVALID_TODO_ID",
      message: "Todo id is invalid.",
    };
  }

  if (error instanceof TodoNotFound) {
    return {
      status: 404,
      code: "TODO_NOT_FOUND",
      message: "Todo was not found.",
    };
  }

  if (error instanceof StorageError) {
    return {
      status: 500,
      code: "STORAGE_ERROR",
      message: "Todo storage failed.",
    };
  }

  if (ParseResult.isParseError(error)) {
    return {
      status: 400,
      code: "INVALID_HTTP_REQUEST",
      message: "HTTP request shape is invalid.",
    };
  }

  if (hasTag(error) && error._tag === "RequestError") {
    return {
      status: 400,
      code: "INVALID_HTTP_REQUEST",
      message: "HTTP request could not be decoded.",
    };
  }

  return {
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error.",
  };
};

export const toErrorResponse = (
  requestId: string,
  error: unknown,
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
