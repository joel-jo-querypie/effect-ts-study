import { Context, Effect } from "effect"
import { StorageError } from "./errors"

export class TodoImportSource extends Context.Tag("TodoImportSource")<
  TodoImportSource,
  {
    readonly readTitleLines: (
      file: string
    ) => Effect.Effect<ReadonlyArray<string>, StorageError>
  }
>() {}
