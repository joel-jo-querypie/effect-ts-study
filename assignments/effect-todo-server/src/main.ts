import { Effect, Layer } from "effect";
import { TodoServerLive } from "./server/live";

void Effect.runPromise(Layer.launch(TodoServerLive));
