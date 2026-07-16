import { Either } from "effect";
import { TodoAlreadyCompleted } from "./error";
import {
  makeActiveTodo,
  makeCompletedTodo,
  makeDeletedTodo,
  type ActiveTodo,
  type CompletedTodo,
  type DeletableTodo,
  type DeletedTodo,
} from "./todo";
import {
  makeTodoCompletedEvent,
  makeTodoCreatedEvent,
  makeTodoDeletedEvent,
  type TodoCompletedEvent,
  type TodoCreatedEvent,
  type TodoDeletedEvent,
} from "./todo-event";
import type { EpochMillis } from "./epoch-millis";
import type { TodoId } from "./todo-id";
import type { TodoTitle } from "./todo-title";

export const createTodo = (input: {
  readonly id: TodoId;
  readonly title: TodoTitle;
  readonly createdAtMillis: EpochMillis;
}): { readonly todo: ActiveTodo; readonly event: TodoCreatedEvent } => {
  const todo = makeActiveTodo(input);

  return {
    todo,
    event: makeTodoCreatedEvent({
      todoId: todo.id,
      title: todo.title,
      occurredAtMillis: todo.createdAtMillis,
    }),
  };
};

export const completeTodo = (
  todo: DeletableTodo,
  completedAtMillis: EpochMillis,
): Either.Either<
  { readonly todo: CompletedTodo; readonly event: TodoCompletedEvent },
  TodoAlreadyCompleted
> => {
  if (todo._tag === "CompletedTodo") {
    return Either.left(new TodoAlreadyCompleted({ id: todo.id }));
  }

  const completedTodo = makeCompletedTodo(todo, completedAtMillis);
  return Either.right({
    todo: completedTodo,
    event: makeTodoCompletedEvent({
      todoId: completedTodo.id,
      occurredAtMillis: completedTodo.completedAtMillis,
    }),
  });
};

export const deleteTodo = (
  todo: DeletableTodo,
  deletedAtMillis: EpochMillis,
): { readonly todo: DeletedTodo; readonly event: TodoDeletedEvent } => {
  const deletedTodo = makeDeletedTodo(todo, deletedAtMillis);

  return {
    todo: deletedTodo,
    event: makeTodoDeletedEvent({
      todoId: deletedTodo.id,
      titleSnapshot: deletedTodo.title,
      occurredAtMillis: deletedTodo.deletedAtMillis,
    }),
  };
};
