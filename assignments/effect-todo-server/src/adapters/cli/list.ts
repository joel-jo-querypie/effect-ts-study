import { Command } from "@effect/cli";
import { Console, Effect, Match } from "effect";
import type { ListedTodo } from "../../domain/todo";
import { listTodos } from "../../programs";

export const listCommand = Command.make("list", {}, () =>
  // Console.log를 Output service로 말아?
  // readonly printLine: (line: string) => Effet.Effect<void>}
  listTodos.pipe(Effect.map(renderTodoList), Effect.flatMap(Console.log)),
);

const renderTodoStatus = Match.type<ListedTodo>().pipe(
  Match.tagsExhaustive({
    ActiveTodo: () => "[ ]",
    BlockedTodo: () => "[!blocked]",
    CompletedTodo: () => "[x]",
  }),
);

const renderTodo = Match.type<ListedTodo>().pipe(
  Match.tagsExhaustive({
    ActiveTodo: (todo) =>
      `${renderTodoStatus(todo)} ${todo.id} ${todo.title} created at ${todo.createdAtMillis}(ms)`,
    BlockedTodo: (todo) =>
      `${renderTodoStatus(todo)} ${todo.id} ${todo.title} blocked at ${todo.blockedAtMillis}(ms) because ${todo.blockedReason}`,
    CompletedTodo: (todo) =>
      `${renderTodoStatus(todo)} ${todo.id} ${todo.title} completed at ${todo.completedAtMillis}(ms)`,
  }),
);

// 무슨 일이 일어났는지 Todo Result 타입으로 표기 되었고, 어댑터인 ui 레이어에서 어떻게 보여줄지 결정하는
const renderTodoList = (todos: ReadonlyArray<ListedTodo>): string => {
  if (todos.length === 0) {
    return "no todos";
  }

  return todos.map(renderTodo).join("\n");
};
