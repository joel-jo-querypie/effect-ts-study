import { Context, Schema } from "effect";

/**
고민해보기.
*/

export const RequestId = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(128),
  Schema.brand("RequestId"),
);
export type RequestId = Schema.Schema.Type<typeof RequestId>;

export const ActorId = Schema.String.pipe(
  Schema.minLength(1),
  Schema.maxLength(128),
  Schema.brand("ActorId"),
);
export type ActorId = Schema.Schema.Type<typeof ActorId>;

export type RequestContextData = {
  readonly requestId: RequestId;
  readonly actorId?: ActorId;
};

export class RequestContext extends Context.Tag("RequestContext")<
  RequestContext,
  RequestContextData
>() {}
