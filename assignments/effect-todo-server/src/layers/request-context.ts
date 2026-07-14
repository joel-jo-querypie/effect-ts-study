import { Layer } from "effect";
import {
  RequestContext,
  type RequestContextData,
} from "../services/request-context";

export const requestContextLayer = (context: RequestContextData) =>
  Layer.succeed(RequestContext, context);

export const CliRequestContextLive = requestContextLayer({
  requestId: "cli",
  actorId: "local-cli",
});
