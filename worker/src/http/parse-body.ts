import { Effect, Schema } from 'effect';
import type { Context } from 'hono';
import { decodeBody, formatParseError } from '../../../shared/src/http/decode';
import type { Bindings } from '../bindings';

/**
 * Hono ルート用: JSON body を Schema で upstream-form デコードする。
 * 失敗時は 400 レスポンスを返す。
 */
export const parseJsonBody = async <A, I>(
  c: Context<{ Bindings: Bindings }>,
  schema: Schema.Schema<A, I>,
): Promise<{ ok: true; data: A } | { ok: false; response: Response }> => {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return {
      ok: false,
      response: c.json({ success: false, error: 'Invalid JSON body' }, 400),
    };
  }

  const exit = await Effect.runPromiseExit(decodeBody(schema)(raw));
  if (exit._tag === 'Failure') {
    const message =
      exit.cause._tag === 'Fail'
        ? formatParseError(exit.cause.error)
        : 'Invalid request body';
    return {
      ok: false,
      response: c.json({ success: false, error: message }, 400),
    };
  }

  return { ok: true, data: exit.value };
};
