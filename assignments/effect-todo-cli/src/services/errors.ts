import { Data } from "effect"

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly operation: string
  readonly message: string
}> { }

/**
 * 이거 무슨 에러일까.. 도메인적으로 예상 가능한 에러일 것 같긴한데..
 * 도메인 책임은 todo를 저장하고, 저장한 것을 가져오고 할 수 있음. 만약 저장된 todo가 없는데 가져오려고 한다면 -> 도메인 규칙에 어긋나는 것
 * 그러니 도메인 에러 아닐까?
 *
 * repository는 저장하라면 잘 저장하고, 가져오라면 잘 가져와야해. 그런데 저장된 todo가 없는데 가져오라고 한다?
 * 이거는 저장소 책임에 벗어나는 것.
 *
 * 비즈니스 결과로 보임
 * AI한테 물어보니 아래 고민해보라 함

 * error가 infrastructure failure인가?
 * domain에서 자연스럽게 말할 수 있는 실패인가?
 * 사용자 액션으로 복구 가능한가?
 */
export class TodoNotFound extends Data.TaggedError("TodoNotFound")<{
  readonly id: string
}> {}
