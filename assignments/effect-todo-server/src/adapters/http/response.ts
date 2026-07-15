import { Match } from "effect";
import type { DeletedTodo, ListedTodo, Todo } from "../../domain/todo";

export type TodoResponseDto =
  | {
      readonly id: string;
      readonly title: string;
      readonly status: "active";
      readonly createdAtMillis: number;
    }
  | {
      readonly id: string;
      readonly title: string;
      readonly status: "blocked";
      readonly createdAtMillis: number;
      readonly blockedReason: string;
      readonly blockedAtMillis: number;
    }
  | {
      readonly id: string;
      readonly title: string;
      readonly status: "completed";
      readonly createdAtMillis: number;
      readonly completedAtMillis: number;
    }
  | {
      readonly id: string;
      readonly title: string;
      readonly status: "deleted";
      readonly createdAtMillis: number;
      readonly deletedAtMillis: number;
    };

export type ListedTodoResponseDto = Exclude<
  TodoResponseDto,
  { readonly status: "deleted" }
>;

export type DeletedTodoResponseDto = Extract<
  TodoResponseDto,
  { readonly status: "deleted" }
>;

export const toTodoResponseDto = Match.type<Todo>().pipe(
  Match.tagsExhaustive({
    ActiveTodo: (todo) => ({
      id: todo.id,
      title: todo.title,
      status: "active" as const,
      createdAtMillis: todo.createdAtMillis,
    }),
    BlockedTodo: (todo) => ({
      id: todo.id,
      title: todo.title,
      status: "blocked" as const,
      createdAtMillis: todo.createdAtMillis,
      blockedReason: todo.blockedReason,
      blockedAtMillis: todo.blockedAtMillis,
    }),
    CompletedTodo: (todo) => ({
      id: todo.id,
      title: todo.title,
      status: "completed" as const,
      createdAtMillis: todo.createdAtMillis,
      completedAtMillis: todo.completedAtMillis,
    }),
    DeletedTodo: (todo) => ({
      id: todo.id,
      title: todo.title,
      status: "deleted" as const,
      createdAtMillis: todo.createdAtMillis,
      deletedAtMillis: todo.deletedAtMillis,
    }),
  }),
);

export const toListedTodoResponseDto = Match.type<ListedTodo>().pipe(
  Match.tagsExhaustive({
    ActiveTodo: (todo) => ({
      id: todo.id,
      title: todo.title,
      status: "active" as const,
      createdAtMillis: todo.createdAtMillis,
    }),
    BlockedTodo: (todo) => ({
      id: todo.id,
      title: todo.title,
      status: "blocked" as const,
      createdAtMillis: todo.createdAtMillis,
      blockedReason: todo.blockedReason,
      blockedAtMillis: todo.blockedAtMillis,
    }),
    CompletedTodo: (todo) => ({
      id: todo.id,
      title: todo.title,
      status: "completed" as const,
      createdAtMillis: todo.createdAtMillis,
      completedAtMillis: todo.completedAtMillis,
    }),
  }),
);

export const toDeletedTodoResponseDto = (
  todo: DeletedTodo,
): DeletedTodoResponseDto => ({
  id: todo.id,
  title: todo.title,
  status: "deleted",
  createdAtMillis: todo.createdAtMillis,
  deletedAtMillis: todo.deletedAtMillis,
});
