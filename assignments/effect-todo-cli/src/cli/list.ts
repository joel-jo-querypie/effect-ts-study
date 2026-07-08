import { Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { listTodos } from "../programs";
import { Todo } from "../domain/todo";

export const listCommand = Command.make("list", {}, () =>
  listTodos.pipe(Effect.map(renderTodoList), Effect.flatMap(Console.log)),
);

const renderTodoStatus = (todo: Todo): string => {
  switch (todo._tag) {
    case "ActiveTodo":
      return "[ ]";
    case "BlockedTodo":
      return "[!blocked]";
    case "CompletedTodo":
      return "[x]";
  }
};

const renderTodoList = (todos: ReadonlyArray<Todo>): string => {
  if (todos.length === 0) {
    return "no todos";
  }

  return todos
    .map((todo) => {
      switch (todo._tag) {
        case "ActiveTodo":
          return `${renderTodoStatus(todo)} ${todo.id} ${todo.title} created at ${todo.createdAtMillis}(ms)`;
        case "BlockedTodo":
          return `${renderTodoStatus(todo)} ${todo.id} ${todo.title} blocked at ${todo.blockedAtMillis}(ms) because ${todo.blockedReason}`;
        case "CompletedTodo":
          return `${renderTodoStatus(todo)} ${todo.id} ${todo.title} completed at ${todo.completedAtMillis}(ms)`;
        default:
          return "";
      }
    })
    .join("\n");
};
