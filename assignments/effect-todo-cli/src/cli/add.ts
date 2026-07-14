import { Args, Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { addTodo } from "../programs";
import { ActiveTodo } from "../domain/todo";

const title = Args.text({ name: "title" });

export const addCommand = Command.make("add", { title }, ({ title }) =>
  addTodo(title).pipe(Effect.map(renderAddedTodo), Effect.flatMap(Console.log)),
);

const renderAddedTodo = (todo: ActiveTodo): string =>
  `added ${todo.id}: ${todo.title}`;
