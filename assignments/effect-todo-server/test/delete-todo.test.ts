import { expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import {
  InMemoryTodoEventStoreLive,
  InMemoryTodoRepositoryLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive,
  requestContextLayer,
} from "../src/layers";
import { addTodo, deleteTodo, listTodos } from "../src/programs";

const TestLive = Layer.mergeAll(
  InMemoryTodoEventStoreLive,
  InMemoryTodoRepositoryLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive,
  requestContextLayer({ requestId: "test-request", actorId: "test-actor" }),
);

it.effect("soft-deleted todos are not returned by list", () =>
  Effect.gen(function* () {
    const added = yield* addTodo("learn atomic events");
    const deleted = yield* deleteTodo(added.id);
    const listed = yield* listTodos();

    expect(deleted._tag).toBe("DeletedTodo");
    expect(deleted.id).toBe(added.id);
    expect(listed.items).toHaveLength(0);
  }).pipe(Effect.provide(TestLive)),
);
