import * as E from 'fp-ts/Either';
import { constVoid, pipe } from 'fp-ts/lib/function';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import * as fs from 'node:fs/promises';

export function copyDist(distPath: string, targetPath: string): T.Task<void> {
  const dist = distPath;
  const target = targetPath;

  return pipe(
    statExists(target),
    T.chain((exists) =>
      exists ? rm(target, { recursive: true }) : T.fromIO(constVoid)
    ),
    T.chain(() => mkdir(target, { recursive: true })),
    T.chain(() => cp(dist, target, { recursive: true }))
  );
}

function cp(src: string, dest: string, options?: { recursive: boolean }) {
  return pipe(
    async () => await fs.cp(src, dest, options),
    (f) => TE.tryCatch(f, E.toError),
    TE.getOrElse(() => T.fromIO(constVoid))
  );
}

function mkdir(path: string, options?: { recursive: boolean }): T.Task<void> {
  return pipe(
    async () => {
      await fs.mkdir(path, options);
    },
    (f) => TE.tryCatch(f, E.toError),
    TE.getOrElse(() => T.fromIO(constVoid))
  );
}

function statExists(path: string): T.Task<boolean> {
  return pipe(
    async () => await fs.stat(path),
    (f) => TE.tryCatch(f, E.toError),
    TE.map(() => true),
    TE.getOrElse(() => T.of(false))
  );
}

function rm(path: string, options?: { recursive: boolean }): T.Task<void> {
  return pipe(
    async () => await fs.rm(path, options),
    (f) => TE.tryCatch(f, E.toError),
    TE.getOrElse(() => T.fromIO(constVoid))
  );
}
