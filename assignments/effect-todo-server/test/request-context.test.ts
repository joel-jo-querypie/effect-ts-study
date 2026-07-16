import { Effect } from "effect";
import { expect, it } from "@effect/vitest";
import { requestContextFromHeaders } from "../src/adapters/http/request";

it.effect("uses parsed request context headers", () =>
  Effect.gen(function* () {
    const context = yield* requestContextFromHeaders({
      "x-request-id": "request-123",
      "x-actor-id": "actor-123",
    });

    expect(context).toEqual({
      requestId: "request-123",
      actorId: "actor-123",
    });
  }),
);

it.effect("uses a fallback request ID for an invalid header before DTO decoding", () =>
  Effect.gen(function* () {
    const context = yield* requestContextFromHeaders({
      "x-request-id": "",
      "x-actor-id": "",
    });

    expect(context.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(context.actorId).toBeUndefined();
  }),
);
