import { Schema } from "effect";

export const EpochMillis = Schema.Number.pipe(
  Schema.int(),
  Schema.nonNegative(),
  Schema.brand("EpochMillis"),
);
export type EpochMillis = Schema.Schema.Type<typeof EpochMillis>;

export const epochMillisFromNumber = (value: number): EpochMillis =>
  Schema.decodeUnknownSync(EpochMillis)(value);
