import { ExecutorContext } from '@nrwl/devkit';
import { identity, pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/lib/IO';
import * as IOE from 'fp-ts/lib/IOEither';
import * as O from 'fp-ts/lib/Option';
import * as RA from 'fp-ts/ReadonlyArray';
import * as path from 'path';
import { getPackageName } from '@embed-dependencies/package-json';
import { addPackage, publishPackage } from '@embed-dependencies/yalc-client';

export function injectDependencies(
  context: ExecutorContext,
  targetPackage: string
) {
  pipe(
    getDistDependencies(context),
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
    ),
    (io) => io()
  );
}

function getDistDependencies(context: ExecutorContext): readonly string[] {
  return pipe(
    O.Do,
    O.bind('projectName', () => O.fromNullable(context.projectName)),
    O.bind('projectGraph', () => O.fromNullable(context.projectGraph)),
    O.map(({ projectName, projectGraph }) =>
      pipe(
        projectGraph.dependencies[projectName],
        RA.map((a) => projectGraph.nodes[a.target]),
        RA.map(O.fromNullable),
        RA.compact,
        RA.map((a) => path.join(context.cwd, 'dist', a.data['root']))
      )
    ),
    O.fold(() => [], identity)
  );
}
