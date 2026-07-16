import { Effect, Either } from "effect";
import { expect, it } from "@effect/vitest";
import { epochMillisFromNumber } from "../src/domain/epoch-millis";
import { makeActiveTodo, makeCompletedTodo } from "../src/domain/todo";
import { todoIdFromString } from "../src/domain/todo-id";
import { todoTitleFromString } from "../src/domain/todo-title";
import {
  completeTodo,
  createTodo,
  deleteTodo,
} from "../src/domain/todo-transition";

const todoId = "00000000-0000-4000-8000-000000000001";

const makeTodoFixture = Effect.gen(function* () {
  const id = yield* todoIdFromString(todoId);
  const title = yield* todoTitleFromString("study domain transitions");
  return makeActiveTodo({
    id,
    title,
    createdAtMillis: epochMillisFromNumber(1),
  });
});

it.effect("creates an active Todo and matching created event", () =>
  Effect.gen(function* () {
    const activeTodo = yield* makeTodoFixture;
    const change = createTodo({
      id: activeTodo.id,
      title: activeTodo.title,
      createdAtMillis: activeTodo.createdAtMillis,
    });

    expect(change.todo).toEqual(activeTodo);
    expect(change.event).toMatchObject({
      _tag: "TodoCreatedEvent",
      todoId: activeTodo.id,
      title: activeTodo.title,
      occurredAtMillis: activeTodo.createdAtMillis,
    });
  }),
);

it.effect("completes an active Todo without mutating it and creates a matching event", () =>
  Effect.gen(function* () {
    const activeTodo = yield* makeTodoFixture;
    const result = completeTodo(activeTodo, epochMillisFromNumber(2));

    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.todo).toMatchObject({
        _tag: "CompletedTodo",
        id: activeTodo.id,
        completedAtMillis: epochMillisFromNumber(2),
      });
      expect(result.right.event).toMatchObject({
        _tag: "TodoCompletedEvent",
        todoId: activeTodo.id,
        occurredAtMillis: epochMillisFromNumber(2),
      });
    }
    expect(activeTodo._tag).toBe("ActiveTodo");
  }),
);

it.effect("rejects completing an already completed Todo", () =>
  Effect.gen(function* () {
    const activeTodo = yield* makeTodoFixture;
    const completedTodo = makeCompletedTodo(activeTodo, epochMillisFromNumber(2));
    const result = completeTodo(completedTodo, epochMillisFromNumber(3));

    expect(result).toMatchObject({
      _tag: "Left",
      left: { _tag: "TodoAlreadyCompleted", id: activeTodo.id },
    });
  }),
);

it.effect("deletes active and completed Todos with a title snapshot event", () =>
  Effect.gen(function* () {
    const activeTodo = yield* makeTodoFixture;
    const completedTodo = makeCompletedTodo(activeTodo, epochMillisFromNumber(2));

    for (const todo of [activeTodo, completedTodo]) {
      const change = deleteTodo(todo, epochMillisFromNumber(3));
      expect(change.todo).toMatchObject({
        _tag: "DeletedTodo",
        id: todo.id,
        deletedAtMillis: epochMillisFromNumber(3),
      });
      expect(change.event).toMatchObject({
        _tag: "TodoDeletedEvent",
        todoId: todo.id,
        titleSnapshot: todo.title,
        occurredAtMillis: epochMillisFromNumber(3),
      });
    }
  }),
);
