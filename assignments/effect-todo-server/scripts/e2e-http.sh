#!/usr/bin/env bash

set -euo pipefail

project_dir="$(cd "$(dirname "$0")/.." && pwd)"
port="${TODO_E2E_PORT:-3010}"
temp_dir="$(mktemp -d)"
database_file="$temp_dir/todos.sqlite"
server_log="$temp_dir/server.log"

cleanup() {
  if [[ -n "${server_pid:-}" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill "$server_pid"
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -rf "$temp_dir"
}

trap cleanup EXIT

cd "$project_dir"
TODO_DATABASE_FILE="$database_file" PORT="$port" pnpm exec tsx src/main.ts >"$server_log" 2>&1 &
server_pid=$!

for _ in {1..50}; do
  if curl --silent --show-error --fail "http://127.0.0.1:$port/todos" >/dev/null 2>&1; then
    break
  fi
  sleep 0.1
done

if ! kill -0 "$server_pid" 2>/dev/null; then
  cat "$server_log"
  exit 1
fi

created="$(curl --silent --show-error --fail-with-body -X POST "http://127.0.0.1:$port/todos" \
  -H 'content-type: application/json' \
  -H 'x-request-id: e2e-create-1' \
  -H 'x-actor-id: e2e-tester' \
  --data '{"title":"verify HTTP e2e"}')"

todo_id="$(node -e '
const todo = JSON.parse(process.argv[1]);
if (todo.status !== "active" || typeof todo.id !== "string") process.exit(1);
process.stdout.write(todo.id);
' "$created")"

listed="$(curl --silent --show-error --fail-with-body "http://127.0.0.1:$port/todos" -H 'x-request-id: e2e-list-1')"
node -e '
const todos = JSON.parse(process.argv[1]);
if (!Array.isArray(todos) || todos.length !== 1 || todos[0].id !== process.argv[2]) process.exit(1);
' "$listed" "$todo_id"

completed="$(curl --silent --show-error --fail-with-body -X POST "http://127.0.0.1:$port/todos/$todo_id/complete" \
  -H 'x-request-id: e2e-complete-1')"
node -e '
const todo = JSON.parse(process.argv[1]);
if (todo.id !== process.argv[2] || todo.status !== "completed") process.exit(1);
' "$completed" "$todo_id"

deleted="$(curl --silent --show-error --fail-with-body -X DELETE "http://127.0.0.1:$port/todos/$todo_id" \
  -H 'x-request-id: e2e-delete-1')"
node -e '
const todo = JSON.parse(process.argv[1]);
if (todo.id !== process.argv[2] || todo.status !== "deleted") process.exit(1);
' "$deleted" "$todo_id"

listed_after_delete="$(curl --silent --show-error --fail-with-body "http://127.0.0.1:$port/todos" -H 'x-request-id: e2e-list-2')"
node -e '
const todos = JSON.parse(process.argv[1]);
if (!Array.isArray(todos) || todos.length !== 0) process.exit(1);
' "$listed_after_delete"

malformed_body_file="$temp_dir/malformed-body.json"
malformed_status="$(curl --silent --show-error -o "$malformed_body_file" -w '%{http_code}' -X POST "http://127.0.0.1:$port/todos" \
  -H 'content-type: application/json' \
  -H 'x-request-id: e2e-malformed-1' \
  --data '{"title":')"

if [[ "$malformed_status" != "400" ]]; then
  cat "$malformed_body_file"
  exit 1
fi

node -e '
const response = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
if (response.error?.code !== "INVALID_HTTP_REQUEST" || response.error?.requestId !== "e2e-malformed-1") process.exit(1);
' "$malformed_body_file"

echo "HTTP e2e passed: create -> list -> complete -> delete -> list, plus malformed JSON."
