import { Command } from "@effect/cli"
import { Effect } from "effect"
import { addCommand } from "./add"
import { doneCommand } from "./done"
import { importCommand } from "./import"
import { listCommand } from "./list"

export const todoCommand = Command.make("todo", {}, () =>
  Effect.void
).pipe(Command.withSubcommands([addCommand, listCommand, doneCommand, importCommand]))
