import { FileSystem } from "@effect/platform"
import { Effect, Layer } from "effect"
import { StorageError } from "../services/errors"
import { TodoImportSource } from "../services/todo-import-source"

const toStorageError = (operation: string) => (cause: unknown) =>
  new StorageError({
    operation,
    message: String(cause)
  })

export const FileTodoImportSourceLive = Layer.effect(
  TodoImportSource,
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem

    return TodoImportSource.of({
      readTitleLines: (file) =>
        fs.readFileString(file).pipe(
          Effect.mapError(toStorageError("read import file")),
          Effect.map((content) => content.split(/\r?\n/))
        )
    })
  })
)
