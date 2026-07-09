import { Effect, Schema } from "effect";
import { InvalidTodoId } from "./error";

export const TodoId = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("TodoId"),
);
export type TodoId = Schema.Schema.Type<typeof TodoId>;

export const todoIdFromString = (
  input: string,
): Effect.Effect<TodoId, InvalidTodoId> =>
  // Effect Schema의 상세 parse error를 domain 밖에서 모르게 할 수 있음.
  // 만약 InvalidTodoId Error가 아닌 날 것의 에러를 domain 외부로 흐르게 한다면? 즉 parsing error를 흐르게 한다면.
  // 추후 TodoId Schema가 변경되거나 갑자기 zod 같은 거로 갈아타거나하면 외부에서는 똑같이 InvalidTodoId 핸들링뿐만 아니라 ZodError 같은 것을 핸들링 해야 할 것임.
  Schema.decodeUnknown(TodoId)(input).pipe(
    Effect.mapError(() => new InvalidTodoId({ input })),
  );
