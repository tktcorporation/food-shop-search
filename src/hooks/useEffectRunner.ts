import { useState, useCallback, useRef } from 'react';
import { Effect, Cause, Layer } from 'effect';
import { extractErrorMessage } from '../utils/effectErrors';
import { AppLive } from '../services';

/** AppLive が提供するサービス群の型 */
type AppServices = Layer.Layer.Success<typeof AppLive>;

export interface EffectRunnerState<A> {
  data: A | null;
  isLoading: boolean;
  error: string | null;
}

export interface EffectRunnerResult<A> extends EffectRunnerState<A> {
  /** AppLive が提供するサービスを必要とする Effect を実行 */
  run: <E>(effect: Effect.Effect<A, E, AppServices>) => void;
  reset: () => void;
}

interface UseEffectRunnerOptions<A> {
  /** 初期データ */
  initialData?: A | null;
  /** エラーメッセージのフォールバック */
  errorFallback?: string;
  /** 成功時のコールバック */
  onSuccess?: (data: A) => void;
  /** エラー時のコールバック */
  onError?: (cause: Cause.Cause<unknown>) => void;
}

/**
 * Effect プログラムを React で実行するための汎用フック。
 * AppLive レイヤーを自動的に提供し、状態管理を抽象化する。
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, run } = useEffectRunner<Restaurant[]>({
 *   errorFallback: '検索に失敗しました',
 * });
 *
 * const handleSearch = () => {
 *   run(searchRestaurantsProgram({ keywords: ['ラーメン'] }));
 * };
 * ```
 */
export const useEffectRunner = <A>(
  options: UseEffectRunnerOptions<A> = {},
): EffectRunnerResult<A> => {
  const {
    initialData = null,
    errorFallback = '予期しないエラーが発生しました。',
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<EffectRunnerState<A>>({
    data: initialData,
    isLoading: false,
    error: null,
  });

  // 実行中のリクエストをキャンセルするためのフラグ
  const runningRef = useRef(false);

  const run = useCallback(
    <E>(effect: Effect.Effect<A, E, AppServices>) => {
      // すでに実行中の場合は何もしない
      if (runningRef.current) return;

      runningRef.current = true;
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const runnable = Effect.provide(effect, AppLive);

      void Effect.runPromiseExit(runnable).then((exit) => {
        runningRef.current = false;

        if (exit._tag === 'Success') {
          setState({
            data: exit.value,
            isLoading: false,
            error: null,
          });
          onSuccess?.(exit.value);
        } else {
          const errorMessage = extractErrorMessage(exit.cause, errorFallback);
          setState({
            data: null,
            isLoading: false,
            error: errorMessage,
          });
          onError?.(exit.cause);
        }
      });
    },
    [errorFallback, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    run,
    reset,
  };
};
