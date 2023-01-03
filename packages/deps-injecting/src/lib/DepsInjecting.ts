import { ExecutorContext } from '@nrwl/devkit';
import { pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as IOE from 'fp-ts/IOEither';
import * as RA from 'fp-ts/ReadonlyArray';
import { getPackageName } from '@embed-dependencies/package-json';
import { addPackage, publishPackage } from '@embed-dependencies/yalc-client';
import { getProjectDependencies } from './getProjectDependencies';

export function injectDependencies(
  context: ExecutorContext,
  targetPackage: string
): IO.IO<void> {
  return pipe(
    getProjectDependencies(context),
    RA.map((a) =>
      pipe(
        publishPackage(context, a),
        IOE.chain(() => getPackageName(a)),
        IOE.chainFirst((b) => addPackage(context, targetPackage, b))
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
