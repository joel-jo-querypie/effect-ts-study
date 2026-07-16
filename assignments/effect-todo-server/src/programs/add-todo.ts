import { Clock, Effect } from "effect";
import { epochMillisFromNumber } from "../domain/epoch-millis";
import { createTodo } from "../domain/todo-transition";
import { todoTitleFromString } from "../domain/todo-title";
import { AtomicRunner } from "../services/atomic-runner";
import { TodoIdGenerator } from "../services/id-generator";
import { TodoEventStore } from "../services/todo-event-store";
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
    const eventStore = yield* TodoEventStore;
    const atomicRunner = yield* AtomicRunner;
    const id = yield* todoIdGenerator.generate;
    const createdAtMillis = epochMillisFromNumber(
      yield* Clock.currentTimeMillis,
    );

    const change = createTodo({ id, title, createdAtMillis });

    return yield* atomicRunner.run(
      Effect.gen(function* () {
        const activeTodo = yield* repository.add(change.todo);
        yield* eventStore.append(change.event);
        return activeTodo;
      }),
    );
  });
