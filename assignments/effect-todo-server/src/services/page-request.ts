import { Schema } from "effect";

const PageLimit = Schema.Number.pipe(
  Schema.int(),
  Schema.between(1, 100),
);

const PageOffset = Schema.Number.pipe(
  Schema.int(),
  Schema.nonNegative(),
);

export const PageRequest = Schema.Struct({
  limit: PageLimit,
  offset: PageOffset,
}).pipe(Schema.brand("PageRequest"));
export type PageRequest = Schema.Schema.Type<typeof PageRequest>;

/**
 * unknown 값
   -> PageRequest schema 검증
   -> 성공: PageRequest 반환
   -> 실패: 동기적으로 ParseError 발생

   그 뒤 바로 object를 넣음
 {
   limit: 50,
   offset: 0,
 }
 */
export const defaultPageRequest = Schema.decodeUnknownSync(PageRequest)({
  limit: 50,
  offset: 0,
});
