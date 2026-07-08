import { Data } from "effect"

export class InvalidTodoId extends Data.TaggedError("InvalidTodoId")<{
  readonly input: string
}> {}

export class InvalidTodoTitle extends Data.TaggedError("InvalidTodoTitle")<{
  readonly input: string
}> {}
