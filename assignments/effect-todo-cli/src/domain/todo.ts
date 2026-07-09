import { Schema } from "effect";
import { TodoId } from "./todo-id";
import { TodoTitle } from "./todo-title";

const TodoFields = {
  id: TodoId,
  title: TodoTitle,
  createdAtMillis: Schema.Number,
};

export const ActiveTodo = Schema.TaggedStruct("ActiveTodo", TodoFields);
export type ActiveTodo = Schema.Schema.Type<typeof ActiveTodo>;

export const BlockedTodo = Schema.TaggedStruct("BlockedTodo", {
  ...TodoFields,
  blockedReason: Schema.String,
  blockedAtMillis: Schema.Number,
});
export type BlockedTodo = Schema.Schema.Type<typeof BlockedTodo>;

export const CompletedTodo = Schema.TaggedStruct("CompletedTodo", {
  ...TodoFields,
  completedAtMillis: Schema.Number,
});
export type CompletedTodo = Schema.Schema.Type<typeof CompletedTodo>;

export const Todo = Schema.Union(ActiveTodo, BlockedTodo, CompletedTodo);
export type Todo = Schema.Schema.Type<typeof Todo>;
export type CompletableTodo = ActiveTodo | BlockedTodo;

export const TodoList = Schema.Array(Todo);
export type TodoList = Schema.Schema.Type<typeof TodoList>;

export const makeActiveTodo = (input: {
  readonly id: TodoId;
  readonly title: TodoTitle;
  readonly createdAtMillis: number;
}): ActiveTodo => ({
  _tag: "ActiveTodo",
  id: input.id,
  title: input.title,
  createdAtMillis: input.createdAtMillis,
});

export const toCompletedTodo = (
  todo: CompletableTodo,
  completedAtMillis: number,
): CompletedTodo => ({
  _tag: "CompletedTodo",
  id: todo.id,
  title: todo.title,
  createdAtMillis: todo.createdAtMillis,
  completedAtMillis,
});

export const toBlockedTodo = (input: {
  readonly todo: ActiveTodo;
  readonly blockedReason: string;
  readonly blockedAtMillis: number;
}): BlockedTodo => ({
  _tag: "BlockedTodo",
  id: input.todo.id,
  title: input.todo.title,
  createdAtMillis: input.todo.createdAtMillis,
  blockedReason: input.blockedReason,
  blockedAtMillis: input.blockedAtMillis,
});

export const toActiveTodo = (todo: BlockedTodo): ActiveTodo => ({
  _tag: "ActiveTodo",
  id: todo.id,
  title: todo.title,
  createdAtMillis: todo.createdAtMillis,
});
