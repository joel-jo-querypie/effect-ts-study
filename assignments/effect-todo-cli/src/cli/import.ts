import { Args, Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { importTodos } from "../programs";
import { ActiveTodo } from "../domain/todo";

const file = Args.text({ name: "file" });

export const importCommand = Command.make("import", { file }, ({ file }) =>
  importTodos(file).pipe(
    Effect.map(renderImportedTodos),
    Effect.flatMap(Console.log),
  ),
);

export const renderImportedTodos = (todos: ReadonlyArray<ActiveTodo>): string =>
  `imported ${todos.length} todo(s)`;
