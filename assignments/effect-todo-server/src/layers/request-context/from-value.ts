import { Layer, Schema } from "effect";
import {
  ActorId,
  RequestContext,
  RequestId,
  type RequestContextData,
} from "../../services/request-context";

export const requestContextLayer = (context: {
  readonly requestId: string;
  readonly actorId?: string;
}) =>
  Layer.succeed(RequestContext, {
    requestId: Schema.decodeUnknownSync(RequestId)(context.requestId),
    ...(context.actorId === undefined
      ? {}
      : { actorId: Schema.decodeUnknownSync(ActorId)(context.actorId) }),
  } satisfies RequestContextData);

export const CliRequestContextLive = requestContextLayer({
  requestId: "cli",
  actorId: "local-cli",
});
