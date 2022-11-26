import { flow, pipe } from 'fp-ts/function';
import * as Json from 'fp-ts/lib/Json';
import * as IO from 'fp-ts/lib/IO';
import * as IOE from 'fp-ts/lib/IOEither';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import * as t from 'io-ts';
import { failure } from 'io-ts/PathReporter';
import * as E from 'fp-ts/lib/Either';
import * as Record from 'fp-ts/lib/Record';

type PackageJson = t.TypeOf<typeof PackageJson>;

const PackageJson = t.readonly(
  t.type({ name: t.string, peerDependencies: t.record(t.string, t.string) })
);

export function _removePeerDependencies(
  packageJson: PackageJson,
  name: string
) {
  return pipe(
    packageJson.peerDependencies,
    Record.deleteAt(name),
    (peerDependencies) => ({ ...packageJson, peerDependencies })
  );
}

export function removePeerDependencies(pathToPackage: string, name: string) {
  return pipe(
    readPackageJson(pathToPackage),
    IOE.map((a) => _removePeerDependencies(a, name)),
    IOE.chain((a) => writePackageJson(pathToPackage, a))
  );
}

function readPackageJson(
  pathToPackage: string
): IOE.IOEither<Error, PackageJson> {
  return pipe(
    join(pathToPackage, 'package.json'),
    (a) => () => readFileSync(a),
    IO.map(String),
    IO.map(Json.parse),
    IOE.mapLeft(E.toError),
    IOE.chainW(
      flow(
        PackageJson.decode,
        E.mapLeft(failure),
        E.mapLeft(() => new Error('Invalid package.json.')),
        IOE.fromEither
      )
    )
  );
}

function writePackageJson(
  pathToPackage: string,
  packageJson: PackageJson
): IOE.IOEither<Error, string> {
  return pipe(
    join(pathToPackage, 'package.json'),
    (a) => () => writeFileSync(a, JSON.stringify(packageJson, null, 2)),
    IO.map(String),
    (f) => IOE.tryCatch(f, E.toError)
  );
}

export function getPackageName(
  pathToPackage: string
): IOE.IOEither<Error, string> {
  return pipe(
    readPackageJson(pathToPackage),
    IOE.map((a) => a.name)
  );
}
