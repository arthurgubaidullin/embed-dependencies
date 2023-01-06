import {
  getPackageName,
  insertDependencies,
} from '@embed-dependencies/package-json-program';
import { ExecutorContext } from '@nrwl/devkit';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { constVoid, flow, pipe } from 'fp-ts/function';
import * as RT from 'fp-ts/ReaderTask';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';

const _exec = promisify(exec);

export function injectDependencies(
  targetPackagePath: string,
  dependencyPaths: readonly string[]
): RT.ReaderTask<{ context: ExecutorContext }, void> {
  return () =>
    pipe(
      TE.of(dependencyPaths),
      TE.chain(
        TE.traverseArray((sourcePackagePath) =>
          pack(sourcePackagePath, targetPackagePath)
        )
      ),
      TE.chainFirst(flow(insertDependencies(targetPackagePath), T.fromIO)),
      TE.map(constVoid),
      TE.fold(
        (e) => async () => {
          console.error(e);
        },
        T.of
      )
    );
}

function pack(
  sourcePackagePath: string,
  targetPath: string
): TE.TaskEither<Error, { name: string; path: string }> {
  return pipe(
    TE.of({ sourcePackagePath, targetPath }),
    TE.bind('packageName', ({ sourcePackagePath }) =>
      pipe(sourcePackagePath, getPackageName, T.fromIO)
    ),
    TE.let('targetPackagePath', ({ packageName }) =>
      path.join(targetPath, 'libs', packageName)
    ),
    TE.chainFirst(({ targetPackagePath }) =>
      TE.fromTask(async () => {
        await fs.mkdir(targetPackagePath, { recursive: true });
      })
    ),
    TE.chainFirst(({ targetPackagePath, sourcePackagePath }) =>
      pipe(
        async () => {
          await _exec(`npm pack --pack-destination ${targetPackagePath}`, {
            cwd: sourcePackagePath,
          });
        },
        (f) => TE.tryCatch(f, E.toError)
      )
    ),
    TE.bind('filename', ({ targetPackagePath }) =>
      pipe(
        async () => await fs.readdir(targetPackagePath),
        TE.fromTask,
        TE.chain(
          TE.fromPredicate(
            A.isNonEmpty,
            () => new Error('Not found package project file.')
          )
        ),
        TE.map((a) => a[0])
      )
    ),
    TE.let(
      'relativePackagePath',
      ({ targetPath, targetPackagePath, filename }) =>
        'file:' +
        path.join(path.relative(targetPath, targetPackagePath), filename)
    ),
    TE.map((a) => ({
      name: a.packageName,
      path: a.relativePackagePath,
    }))
  );
}
