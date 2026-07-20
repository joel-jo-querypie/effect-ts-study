import { Effect } from "effect";
import { expect, it } from "@effect/vitest";
import { listedTodosFromRows } from "../src/layers/todo-repository/sqlite-row";

it.effect("fails when a list query result contains a deleted Todo", () =>
  Effect.gen(function* () {
    const result = yield* Effect.either(
      listedTodosFromRows([
        {
          id: "00000000-0000-4000-8000-000000000001",
          title: "deleted Todo in list result",
          status: "deleted",
          created_at_millis: 1,
          completed_at_millis: null,
          deleted_at_millis: 2,
        },
      ]),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toMatchObject({
        _tag: "StorageError",
        operation: "decode listed todo row",
      });
    }
  }),
);
