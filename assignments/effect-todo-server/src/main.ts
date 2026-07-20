import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { TodoServerLive } from "./server/live";

NodeRuntime.runMain(Layer.launch(TodoServerLive));
