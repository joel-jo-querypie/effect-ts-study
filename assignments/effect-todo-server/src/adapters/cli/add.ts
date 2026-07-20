import { Args, Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { ActiveTodo } from "../../domain/todo";
import { addTodo } from "../../programs";

const title = Args.text({ name: "title" });

export const addCommand = Command.make("add", { title }, ({ title }) =>
  addTodo(title).pipe(Effect.map(renderAddedTodo), Effect.flatMap(Console.log)),
);

const renderAddedTodo = (todo: ActiveTodo): string =>
  `added ${todo.id}: ${todo.title}`;
