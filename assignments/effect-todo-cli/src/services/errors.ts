import { Data } from "effect"

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly operation: string
  readonly message: string
}> {}

export class TodoNotFound extends Data.TaggedError("TodoNotFound")<{
  readonly id: string
}> {}
