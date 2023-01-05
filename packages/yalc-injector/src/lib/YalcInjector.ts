import { getPackageName } from '@embed-dependencies/package-json-program';
import { addPackage, publishPackage } from '@embed-dependencies/yalc-client';
import { ExecutorContext } from '@nrwl/devkit';
import { pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as IOE from 'fp-ts/IOEither';
import * as RIO from 'fp-ts/ReaderIO';
import * as RA from 'fp-ts/ReadonlyArray';

export function injectDependencies(
  targetPackage: string,
  dependencies: readonly string[]
): RIO.ReaderIO<{ context: ExecutorContext }, void> {
  return (P) =>
    pipe(
      dependencies,
      RA.map((a) =>
        pipe(
          publishPackage(P.context, a),
          IOE.chain(() => getPackageName(a)),
          IOE.chainFirst((b) => addPackage(P.context, targetPackage, b))
        )
      ),
      IOE.sequenceArray,
      IOE.fold(
        (e) => () => {
          console.error(e);
        },
        IO.of
      )
    );
}
