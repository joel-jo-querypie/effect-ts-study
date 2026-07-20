import { Args, Command } from "@effect/cli";
import { Console, Effect } from "effect";
import { doneTodo } from "../programs";
import { CompletedTodo } from "../domain/todo";

const id = Args.text({ name: "id" });

export const doneCommand = Command.make("done", { id }, ({ id }) =>
  doneTodo(id).pipe(Effect.map(renderDoneTodo), Effect.flatMap(Console.log)),
);

export const renderDoneTodo = (todo: CompletedTodo): string =>
  `done ${todo.id}: ${todo.title}`;
