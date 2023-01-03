import { ExecutorContext } from '@nrwl/devkit';
import { pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as RIO from 'fp-ts/ReaderIO';
import * as IOE from 'fp-ts/IOEither';
import * as RA from 'fp-ts/ReadonlyArray';
import { getPackageName } from '@embed-dependencies/package-json';
import { addPackage, publishPackage } from '@embed-dependencies/yalc-client';
import { getProjectDependencies } from './getProjectDependencies';

export function injectDependencies(
  targetPackage: string
): RIO.ReaderIO<{ context: ExecutorContext }, void> {
  return (P) =>
    pipe(
      getProjectDependencies(P.context),
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
