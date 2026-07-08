import { Effect, Layer, Random } from "effect"
import { TodoId } from "../domain/todo-id"
import { TodoIdGenerator } from "../services/id-generator"

export const RandomTodoIdGeneratorLive = Layer.succeed(
  TodoIdGenerator,
  TodoIdGenerator.of({
    generate: Random.nextIntBetween(100_000, 999_999).pipe(
      Effect.map((value) => TodoId.make(`todo-${value.toString(36)}`))
    )
  })
)
