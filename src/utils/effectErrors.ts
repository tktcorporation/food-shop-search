import { Cause } from 'effect';

/** Effect の Cause からユーザー向けメッセージを抽出する */
export const extractErrorMessage = (
  cause: Cause.Cause<unknown>,
  fallback = '予期しないエラーが発生しました。',
): string => {
  const failures = Cause.failures(cause);
  const firstFailure = Array.from(failures)[0];
  if (
    firstFailure &&
    typeof firstFailure === 'object' &&
    firstFailure !== null &&
    'message' in firstFailure
  ) {
    return (firstFailure as { message: string }).message;
  }
  return fallback;
};

/** Effect の Cause から最初の失敗を取得する */
export const extractFirstFailure = (cause: Cause.Cause<unknown>): unknown => {
  const failures = Cause.failures(cause);
  return Array.from(failures)[0];
};

/** 失敗が特定の _tag を持つかチェックする */
export const hasErrorTag = (failure: unknown, tag: string): boolean => {
  return (
    typeof failure === 'object' &&
    failure !== null &&
    '_tag' in failure &&
    (failure as { _tag: string })._tag === tag
  );
};

/** 失敗から数値コードを取得する（GeolocationError 等） */
export const getErrorCode = (failure: unknown): number | undefined => {
  if (typeof failure === 'object' && failure !== null && 'code' in failure) {
    return (failure as { code: number }).code;
  }
  return undefined;
};
