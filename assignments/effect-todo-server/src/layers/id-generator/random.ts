import { Effect, Layer, Random } from "effect"
import { TodoId } from "../../domain/todo-id"
import { TodoIdGenerator } from "../../services/id-generator"

// program은 random 구현 detail이 아니라 유효한 TodoId를 하나 얻는 능력을 필요로 한다.
export const RandomTodoIdGeneratorLive = Layer.succeed(
  TodoIdGenerator,
  TodoIdGenerator.of({
    generate: Effect.all(
      Array.from({ length: 16 }, () => Random.nextIntBetween(0, 256)),
    ).pipe(Effect.map((bytes) => TodoId.make(formatUuid(bytes)))),
  }),
);

const formatUuid = (bytes: ReadonlyArray<number>): string => {
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, "0"));
  hex[6] = `4${hex[6][1]}`;
  hex[8] = `${["8", "9", "a", "b"][bytes[8] & 0x03]}${hex[8][1]}`;
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
};
