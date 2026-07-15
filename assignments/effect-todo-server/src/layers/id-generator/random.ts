import { Effect, Layer, Random } from "effect"
import { TodoId } from "../../domain/todo-id"
import { TodoIdGenerator } from "../../services/id-generator"

// program은 rand num 하나가 아니라 TodoId를 하나 얻는 능력을 필요로 할 것
export const RandomTodoIdGeneratorLive = Layer.succeed(
  TodoIdGenerator,
  TodoIdGenerator.of({
    generate: Random.nextIntBetween(100_000, 999_999).pipe(
      Effect.map((value) => TodoId.make(`todo-${value.toString(36)}`))
    )
  })
)
