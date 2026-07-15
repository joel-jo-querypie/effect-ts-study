import { Data } from "effect"

export class InvalidTodoId extends Data.TaggedError("InvalidTodoId")<{
  readonly input: string
}> {}

export class InvalidTodoTitle extends Data.TaggedError("InvalidTodoTitle")<{
  readonly input: string
}> {}

export class TodoAlreadyCompleted extends Data.TaggedError("TodoAlreadyCompleted")<{
  readonly id: string
}> {}

/**
 *
 * 에러를 어느 정도로 나눠야 할까?
 * 유저에게 다른 메시지를 보여야하거나, 특정 에러시에 다른 방식으로 처리해야하는 에러면 분리를?
 * 그런게 아니라면 그냥 묶어서 operation, message 조합으로 처리해줘도 될듯.
 */
