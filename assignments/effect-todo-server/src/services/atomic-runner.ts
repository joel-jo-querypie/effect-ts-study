import { Context, Effect } from "effect";
import type { StorageError } from "./errors";

export class AtomicRunner extends Context.Tag("AtomicRunner")<
  AtomicRunner,
  {
    readonly run: <A, E, R>(
      effect: Effect.Effect<A, E, R>,
    ) => Effect.Effect<A, E | StorageError, R>;
  }
>() {}
