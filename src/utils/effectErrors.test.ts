import { describe, it, expect } from 'vitest';
import { Cause } from 'effect';
import {
  extractErrorMessage,
  extractFirstFailure,
  hasErrorTag,
  getErrorCode,
} from './effectErrors';

describe('extractErrorMessage', () => {
  it('extracts message from a failure cause', () => {
    const cause = Cause.fail({ message: 'Something went wrong' });
    expect(extractErrorMessage(cause)).toBe('Something went wrong');
  });

  it('returns fallback when no message property exists', () => {
    const cause = Cause.fail({ code: 123 });
    expect(extractErrorMessage(cause)).toBe('予期しないエラーが発生しました。');
  });

  it('returns custom fallback message', () => {
    const cause = Cause.fail({ code: 123 });
    expect(extractErrorMessage(cause, 'カスタムエラー')).toBe('カスタムエラー');
  });

  it('returns fallback for empty cause', () => {
    const cause = Cause.empty;
    expect(extractErrorMessage(cause)).toBe('予期しないエラーが発生しました。');
  });
});

describe('extractFirstFailure', () => {
  it('extracts the first failure from a cause', () => {
    const error = { _tag: 'TestError', message: 'test' };
    const cause = Cause.fail(error);
    expect(extractFirstFailure(cause)).toEqual(error);
  });

  it('returns undefined for empty cause', () => {
    const cause = Cause.empty;
    expect(extractFirstFailure(cause)).toBeUndefined();
  });
});

describe('hasErrorTag', () => {
  it('returns true when failure has matching tag', () => {
    const failure = { _tag: 'GeolocationError', message: 'error' };
    expect(hasErrorTag(failure, 'GeolocationError')).toBe(true);
  });

  it('returns false when failure has different tag', () => {
    const failure = { _tag: 'OtherError', message: 'error' };
    expect(hasErrorTag(failure, 'GeolocationError')).toBe(false);
  });

  it('returns false for non-object values', () => {
    expect(hasErrorTag(null, 'Test')).toBe(false);
    expect(hasErrorTag('string', 'Test')).toBe(false);
    expect(hasErrorTag(undefined, 'Test')).toBe(false);
  });
});

describe('getErrorCode', () => {
  it('extracts code from failure object', () => {
    const failure = { code: 1, message: 'Permission denied' };
    expect(getErrorCode(failure)).toBe(1);
  });

  it('returns undefined when no code property', () => {
    const failure = { message: 'No code here' };
    expect(getErrorCode(failure)).toBeUndefined();
  });

  it('returns undefined for non-object values', () => {
    expect(getErrorCode(null)).toBeUndefined();
    expect(getErrorCode(undefined)).toBeUndefined();
  });
});
