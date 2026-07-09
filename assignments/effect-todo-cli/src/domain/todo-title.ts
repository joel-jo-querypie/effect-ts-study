import { Effect, Schema } from "effect";
import { InvalidTodoTitle } from "./error";

export const TodoTitle = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("TodoTitle"),
);
export type TodoTitle = Schema.Schema.Type<typeof TodoTitle>;

export const todoTitleFromString = (
  input: string,
  /**
   * Effect는 외부 인프라 사이드 이펙이 아닌 성공, 실패 가능성 표현하는 추상화 도구니까
   * domain이 effect를 알아도 괜찮고, Either 같은 것 보다는 프로그램이 Effect.gen이니까 Effect 검증이 좋을듯?
   */
): Effect.Effect<TodoTitle, InvalidTodoTitle> => {
  const trimmed = input.trim();
  return Schema.decodeUnknown(TodoTitle)(trimmed).pipe(
    Effect.mapError(() => new InvalidTodoTitle({ input })),
  );
};
