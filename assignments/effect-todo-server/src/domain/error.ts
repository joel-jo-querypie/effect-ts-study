import { Data } from "effect"

export class InvalidTodoId extends Data.TaggedError("InvalidTodoId")<{
  readonly input: string
}> {}

export class InvalidTodoTitle extends Data.TaggedError("InvalidTodoTitle")<{
  readonly input: string
}> { }


/**
 * 오류의 소유권은 발생 위치가 아니라 오류가 표현하는 의미로 결정한다/**
  어디서 발견했는가가 아니라, 이 오류가 무엇을 의미하는가
  TodoAlreadyCompleted
    = 이미 완료된 Todo를 다시 완료할 수 없다
    = Todo 상태 전이 규칙 위반
    = domain error
    현재 SQLite repository가 이 오류를 만들어도 ownership이 service로 바뀌지는 않습니다.
  repository가 하는 일:
    DB의 현재 상태를 원자적으로 확인
  domain error가 말하는 일:
    completed -> completed 전이는 허용하지 않음

    즉:
  규칙의 소유자: domain
  규칙 위반을 발견하는 장소: repository
  규칙 위반을 HTTP 409로 표현하는 장소: HTTP adapter
  이것이 가장 자연스러운 해석입니다.
  반대로 TodoNotFound는 조금 달라요.
  TodoNotFound
    = 저장된 Todo를 조회/전이하려 했는데 대상이 없음
    = persisted state를 알아야만 판단 가능
    = port/application error에 더 가까움
  */

export class TodoAlreadyCompleted extends Data.TaggedError("TodoAlreadyCompleted")<{
  readonly id: string
}> {}

/**
 *
 * 에러를 어느 정도로 나눠야 할까?
 * 유저에게 다른 메시지를 보여야하거나, 특정 에러시에 다른 방식으로 처리해야하는 에러면 분리를?
 * 그런게 아니라면 그냥 묶어서 operation, message 조합으로 처리해줘도 될듯.
 */
