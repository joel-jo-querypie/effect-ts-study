import { Schema } from "effect";
import { EpochMillis } from "./epoch-millis";
import { TodoId } from "./todo-id";
import { TodoTitle } from "./todo-title";

export const TodoCreatedEvent = Schema.TaggedStruct("TodoCreatedEvent", {
  todoId: TodoId,
  title: TodoTitle,
  occurredAtMillis: EpochMillis,
});
export type TodoCreatedEvent = Schema.Schema.Type<typeof TodoCreatedEvent>;

export const TodoCompletedEvent = Schema.TaggedStruct("TodoCompletedEvent", {
  todoId: TodoId,
  occurredAtMillis: EpochMillis,
});
export type TodoCompletedEvent = Schema.Schema.Type<typeof TodoCompletedEvent>;

export const TodoDeletedEvent = Schema.TaggedStruct("TodoDeletedEvent", {
  todoId: TodoId,
  titleSnapshot: TodoTitle,
  occurredAtMillis: EpochMillis,
});
export type TodoDeletedEvent = Schema.Schema.Type<typeof TodoDeletedEvent>;

export const TodoEvent = Schema.Union(
  TodoCreatedEvent,
  TodoCompletedEvent,
  TodoDeletedEvent,
);
export type TodoEvent = Schema.Schema.Type<typeof TodoEvent>;

export const makeTodoCreatedEvent = (input: {
  readonly todoId: TodoId;
  readonly title: TodoTitle;
  readonly occurredAtMillis: EpochMillis;
}): TodoCreatedEvent => ({
  _tag: "TodoCreatedEvent",
  todoId: input.todoId,
  title: input.title,
  occurredAtMillis: input.occurredAtMillis,
});

export const makeTodoCompletedEvent = (input: {
  readonly todoId: TodoId;
  readonly occurredAtMillis: EpochMillis;
}): TodoCompletedEvent => ({
  _tag: "TodoCompletedEvent",
  todoId: input.todoId,
  occurredAtMillis: input.occurredAtMillis,
});

export const makeTodoDeletedEvent = (input: {
  readonly todoId: TodoId;
  readonly titleSnapshot: TodoTitle;
  readonly occurredAtMillis: EpochMillis;
}): TodoDeletedEvent => ({
  _tag: "TodoDeletedEvent",
  todoId: input.todoId,
  titleSnapshot: input.titleSnapshot,
  occurredAtMillis: input.occurredAtMillis,
});
