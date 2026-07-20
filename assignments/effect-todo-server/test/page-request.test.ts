import { Effect, Schema } from "effect";
import { expect, it } from "@effect/vitest";
import { ListTodosRequestDto } from "../src/adapters/http/request";

it.effect("parses list search parameters into one PageRequest", () =>
  Effect.gen(function* () {
    const decoded = yield* Schema.decodeUnknown(ListTodosRequestDto)({
      headers: {},
      searchParams: { limit: "20", offset: "40" },
    });

    expect(decoded.searchParams).toEqual({ limit: 20, offset: 40 });
  }),
);

it.effect("rejects a list request outside the PageRequest invariant", () =>
  Effect.gen(function* () {
    const result = yield* Effect.either(
      Schema.decodeUnknown(ListTodosRequestDto)({
        headers: {},
        searchParams: { limit: "101", offset: "-1" },
      }),
    );

    expect(result._tag).toBe("Left");
  }),
);
