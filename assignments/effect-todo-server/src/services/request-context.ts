import { Context } from "effect";

export type RequestContextData = {
  readonly requestId: string;
  readonly actorId?: string;
};

export class RequestContext extends Context.Tag("RequestContext")<
  RequestContext,
  RequestContextData
>() {}
