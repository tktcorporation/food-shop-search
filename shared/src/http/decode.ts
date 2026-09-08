import { Effect, ParseResult, Schema } from 'effect';

/**
 * Upstream-form: 境界の unknown を Schema でドメイン型にデコードする。
 * ParseError はそのまま Effect エラーチャネルに載せる。
 */
export const decodeUnknown =
  <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  (input: unknown): Effect.Effect<A, ParseResult.ParseError, R> =>
    Schema.decodeUnknown(schema)(input);

/**
 * HTTP JSON body を Schema でデコードするショートカット。
 */
export const decodeBody =
  <A, I, R>(schema: Schema.Schema<A, I, R>) =>
  (body: unknown): Effect.Effect<A, ParseResult.ParseError, R> =>
    decodeUnknown(schema)(body);

/**
 * ParseError を人間向けメッセージにまとめる。
 */
export const formatParseError = (error: ParseResult.ParseError): string =>
  ParseResult.TreeFormatter.formatErrorSync(error);
