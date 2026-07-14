import { Clock, Effect } from "effect";
import { makeActiveTodo } from "../domain/todo";
import { todoTitleFromString } from "../domain/todo-title";
import { TodoIdGenerator } from "../services/id-generator";
import { TodoRepository } from "../services/todo-repository";

/**
 * title을 검증
 * string primitive type을 ActiveTodo 만듦, repository에 저장, 결과 반환
 * id 생성 로직은 addTodo 의 관심사가 아님. 무엇이 외부 영향으로 바뀔 수 있나?
 * -> id format을 변경하고 싶어, test에서 fixed id 쓰고 싶어
 * 이때 addTodo가 수정되면 안되지 않을까.
 */
export const addTodo = (titleInput: string) =>
  Effect.gen(function* () {
    const title = yield* todoTitleFromString(titleInput);
    const todoIdGenerator = yield* TodoIdGenerator;
    const repository = yield* TodoRepository;
    const id = yield* todoIdGenerator.generate;
    const createdAtMillis = yield* Clock.currentTimeMillis;
    const activeTodo = yield* repository.add(
      makeActiveTodo({ id, title, createdAtMillis }),
    );

    return activeTodo;
  });
