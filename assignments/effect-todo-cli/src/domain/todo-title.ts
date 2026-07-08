import { Effect, Schema } from "effect";
import { InvalidTodoTitle } from "./error";

export const TodoTitle = Schema.String.pipe(
  Schema.minLength(1),
  Schema.brand("TodoTitle"),
);
export type TodoTitle = Schema.Schema.Type<typeof TodoTitle>;

export const todoTitleFromString = (
  input: string,
): Effect.Effect<TodoTitle, InvalidTodoTitle> => {
  const trimmed = input.trim();
  return Schema.decodeUnknown(TodoTitle)(trimmed).pipe(
    Effect.mapError(() => new InvalidTodoTitle({ input })),
  );
};
