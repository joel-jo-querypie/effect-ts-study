import { SqlClient } from "@effect/sql";
import { Effect, Layer, Match } from "effect";
import type { TodoEvent } from "../../domain/todo-event";
import { RequestContext } from "../../services/request-context";
import { TodoEventStore } from "../../services/todo-event-store";
import { toStorageError } from "../sqlite/errors";

const eventAction = Match.type<TodoEvent>().pipe(
  Match.tagsExhaustive({
    TodoCreatedEvent: () => "CreateTodo",
    TodoCompletedEvent: () => "CompleteTodo",
    TodoDeletedEvent: () => "DeleteTodo",
  }),
);

export const SqliteTodoEventStoreLive = Layer.effect(
  TodoEventStore,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;

    return TodoEventStore.of({
      append: (event) =>
        Effect.gen(function* () {
          const requestContext = yield* RequestContext;

          yield* sql`
            INSERT INTO audit_logs (
              request_id,
              actor_id,
              action,
              target_todo_id,
              result,
              reason,
              occurred_at_millis,
              payload_json,
            ) VALUES (
              ${requestContext.requestId},
              ${requestContext.actorId ?? null},
              ${eventAction(event)},
              ${event.todoId},
              'Succeeded',
              NULL,
              ${event.occurredAtMillis},
              ${JSON.stringify(event)}
            )
          `.pipe(Effect.mapError(toStorageError("append audit log")));
          return event;
        }),
    });
  }),
);
