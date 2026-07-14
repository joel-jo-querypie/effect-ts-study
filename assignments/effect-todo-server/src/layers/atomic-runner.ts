import { Layer } from "effect";
import { AtomicRunner } from "../services/atomic-runner";

export const PassthroughAtomicRunnerLive = Layer.succeed(
  AtomicRunner,
  AtomicRunner.of({
    run: (effect) => effect,
  }),
);
