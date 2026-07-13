# Effect Todo HTTP/RPC Server 과제

## Docs

- [Spec](./docs/spec.md)

## 과제 설명

기존 Todo CLI 과제에서 만든 `domain / services / programs / layers` 구조를 버리지 않고, HTTP 또는 RPC 서버로 확장해본다.
핵심은 단순 Todo CRUD 서버가 아니라, 서버 환경에서 필요한 request validation, typed error, requestId, DB transaction, audit log를 Effect 방식으로 다뤄보는 것이다.

이번 과제는 outbox, queue, fire-and-forget을 다루지 않는다.
Todo 변경과 audit log 기록을 동일 DB transaction 안에서 함께 성공 또는 실패하게 만드는 것이 중심이다.

HTTP를 선택한다면 구현할 API:

```bash
POST /todos
GET /todos
POST /todos/:id/complete
DELETE /todos/:id
```

RPC를 선택한다면 같은 의미의 `createTodo`, `listTodos`, `completeTodo`, `deleteTodo` operation을 제공한다.

중점 학습:

- CLI adapter를 HTTP/RPC adapter로 바꾸어도 core program 구조가 유지되는지 확인
- request validation (`Effect.Schema` 사용 권장)
- typed error를 표준 HTTP/RPC error response로 변환
- 모든 요청에 `requestId` 부여
- 실제 DB를 사용한 transaction boundary 구성
- Todo mutation과 audit log append를 하나의 transaction으로 묶기
- 선택 확장: rejected/query action도 audit log로 남기기
- repository, id generator, audit log 저장 구현을 `Layer`로 교체 가능하게 만들기

## 프로젝트 세팅 방법

repo는 pnpm workspace로 구성되어 있다. 루트에서 의존성을 설치한다.

```bash
pnpm install
cd assignments/effect-todo-server
```

현재 scaffold는 TypeScript 에러가 나지 않는 최소 entrypoint와 디렉토리 구조만 제공한다.

```txt
src/
  main.ts
  server/
  adapters/
    cli/
    http/
    rpc/
  domain/
  services/
  programs/
  layers/
```

기존 CLI 과제를 완료했다면 `assignments/effect-todo-cli/src/domain`, `services`, `programs`, `layers`, `cli`의 설계를 참고하거나 복사해서 시작해도 된다.
단, file repository 중심 구현은 DB-backed repository와 transaction boundary로 교체해야 한다.

CLI 과제에서 만든 core 디렉토리와 CLI adapter를 그대로 가져오고 싶다면 아래 스크립트를 사용할 수 있다.

```bash
# assignments/effect-todo-server 디렉토리에서
pnpm copy:cli-core

# repo root에서
pnpm --filter effect-todo-server copy:cli-core
```

이 스크립트는 `cli`를 `src/adapters/cli` 아래로 복사한다.
`src/adapters/http`, `src/adapters/rpc`는 새 서버 adapter를 구현할 빈 디렉토리로 남겨둔다.

이미 server 과제 쪽 `domain`, `services`, `programs`, `layers`, `adapters/cli`에 작업한 파일이 있으면 기본적으로 덮어쓰지 않는다.
의도적으로 다시 복사하려면 다음처럼 실행한다.

```bash
# assignments/effect-todo-server 디렉토리에서
pnpm copy:cli-core -- --force

# repo root에서
pnpm --filter effect-todo-server copy:cli-core -- --force
```

이 스크립트는 시작점만 만들어준다.
복사 후에는 file-backed layer를 DB-backed transaction/audit layer로 바꾸는 것이 이번 과제의 핵심이다.

placeholder entrypoint는 바로 실행해볼 수 있다.

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm dev
```

실제 Todo API, DB schema, transaction 구현은 과제 수행자가 직접 작성한다.
DB-backed repository, transaction, audit log 구현은 `src/layers` 아래에 자유롭게 배치한다.
파일이 많아지면 `src/layers/sqlite` 같은 하위 디렉토리를 만들거나, 선택적으로 `src/db`를 만들어 DB 관련 파일만 따로 관리해도 된다.
레이어별 책임과 세부 요구사항은 [Spec](./docs/spec.md)을 참고한다.
