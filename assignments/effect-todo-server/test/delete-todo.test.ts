import { expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import {
  InMemoryTodoEventStoreLive,
  InMemoryTodoRepositoryLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive,
} from "../src/layers";
import { addTodo, deleteTodo, listTodos } from "../src/programs";

const TestLive = Layer.mergeAll(
  InMemoryTodoEventStoreLive,
  InMemoryTodoRepositoryLive,
  PassthroughAtomicRunnerLive,
  RandomTodoIdGeneratorLive,
);

it.effect("soft-deleted todos are not returned by list", () =>
  Effect.gen(function* () {
    const added = yield* addTodo("learn atomic events");
    const deleted = yield* deleteTodo(added.id);
    const listed = yield* listTodos;

    expect(deleted._tag).toBe("DeletedTodo");
    expect(deleted.id).toBe(added.id);
    expect(listed).toHaveLength(0);
  }).pipe(Effect.provide(TestLive)),
);
