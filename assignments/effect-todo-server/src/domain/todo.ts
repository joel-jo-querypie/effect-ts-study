import { Schema } from "effect";
import { EpochMillis } from "./epoch-millis";
import { TodoId } from "./todo-id";
import { TodoTitle } from "./todo-title";

const TodoFields = {
  id: TodoId,
  title: TodoTitle,
  createdAtMillis: EpochMillis,
};

export const ActiveTodo = Schema.TaggedStruct("ActiveTodo", TodoFields);
export type ActiveTodo = Schema.Schema.Type<typeof ActiveTodo>;

export const CompletedTodo = Schema.TaggedStruct("CompletedTodo", {
  ...TodoFields,
  completedAtMillis: EpochMillis,
});
export type CompletedTodo = Schema.Schema.Type<typeof CompletedTodo>;

export const DeletedTodo = Schema.TaggedStruct("DeletedTodo", {
  ...TodoFields,
  deletedAtMillis: EpochMillis,
});
export type DeletedTodo = Schema.Schema.Type<typeof DeletedTodo>;

export const Todo = Schema.Union(
  ActiveTodo,
  CompletedTodo,
  DeletedTodo,
);
export type Todo = Schema.Schema.Type<typeof Todo>;
export type CompletableTodo = ActiveTodo;
export type DeletableTodo = ActiveTodo | CompletedTodo;
export type ListedTodo = DeletableTodo;

export const TodoList = Schema.Array(Todo);
export type TodoList = Schema.Schema.Type<typeof TodoList>;

export const makeActiveTodo = (input: {
  readonly id: TodoId;
  readonly title: TodoTitle;
  readonly createdAtMillis: EpochMillis;
}): ActiveTodo => ({
  _tag: "ActiveTodo",
  id: input.id,
  title: input.title,
  createdAtMillis: input.createdAtMillis,
});

export const makeCompletedTodo = (
  todo: CompletableTodo,
  completedAtMillis: EpochMillis,
): CompletedTodo => ({
  _tag: "CompletedTodo",
  id: todo.id,
  title: todo.title,
  createdAtMillis: todo.createdAtMillis,
  completedAtMillis,
});

export const makeDeletedTodo = (
  todo: DeletableTodo,
  deletedAtMillis: EpochMillis,
): DeletedTodo => ({
  _tag: "DeletedTodo",
  id: todo.id,
  title: todo.title,
  createdAtMillis: todo.createdAtMillis,
  deletedAtMillis,
});
