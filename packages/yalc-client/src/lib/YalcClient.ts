import { execSync } from 'child_process';
import { pipe } from 'fp-ts/function';
import * as E from 'fp-ts/lib/Either';
import * as IO from 'fp-ts/lib/IO';
import * as IOE from 'fp-ts/lib/IOEither';
import { join } from 'node:path';

interface CWD {
  readonly cwd: string;
}

function getStoreFolder(context: CWD): IO.IO<string> {
  return () => join(context.cwd, '.yalc');
}

export function publishPackage(
  context: CWD,
  pathToPackage: string
): IOE.IOEither<Error, string> {
  return pipe(
    getStoreFolder(context),
    IO.chainFirst(() => () => {
      process.chdir(pathToPackage);
    }),
    IO.chain((storeFolder) => () => {
      return pipe(
        execSync(`npx yalc publish --store-folder=${storeFolder} --changed`),
        String
      );
    }),
    (f) => IOE.tryCatch(f, E.toError)
  );
}

export function addPackage(
  context: CWD,
  targetPackage: string,
  packageName: string
): IOE.IOEither<Error, string> {
  return pipe(
    getStoreFolder(context),
    IO.chainFirst(() => () => {
      process.chdir(targetPackage);
    }),
    IO.chain((storeFolder) => () => {
      return pipe(
        execSync(`npx yalc add ${packageName} --store-folder=${storeFolder}`),
        String
      );
    }),
    (f) => IOE.tryCatch(f, E.toError)
  );
}
