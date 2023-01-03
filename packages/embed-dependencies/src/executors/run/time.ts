import { constVoid, pipe } from 'fp-ts/function';
import * as T from 'fp-ts/Task';

export function time(
  functionName: string,
  options: Readonly<{ isVerbose: boolean }>
): <A>(t: T.Task<A>) => T.Task<A> {
  return (t) =>
    pipe(
      T.Do,
      T.bind('before', () => T.fromIO(performance.now)),
      T.bind('result', () => t),
      T.bind('after', () => T.fromIO(performance.now)),
      T.let('performance', ({ before, after }) => Math.floor(after - before)),
      T.let(
        'message',
        ({ performance }) =>
          `The \`${functionName}\` function took ${performance} milliseconds.`
      ),
      T.chainFirstIOK(({ message }) =>
        options.isVerbose ? () => console.log(message) : constVoid
      ),
      T.map((a) => a.result)
    );
}
