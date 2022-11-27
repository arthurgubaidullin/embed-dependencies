import { flow, pipe } from 'fp-ts/function';
import * as Json from 'fp-ts/Json';
import * as IO from 'fp-ts/IO';
import * as IOE from 'fp-ts/IOEither';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import * as t from 'io-ts';
import { failure } from 'io-ts/PathReporter';
import * as E from 'fp-ts/Either';
import * as Record from 'fp-ts/Record';
import * as A from 'fp-ts/Array';
import * as S from 'fp-ts/string';

type PackageJson = t.TypeOf<typeof PackageJson>;

const PackageJson = t.readonly(
  t.type({
    name: t.string,
    peerDependencies: t.record(t.string, t.string),
    dependencies: t.record(t.string, t.string),
  })
);

export function _removePeerDependencies(
  packageJson: PackageJson,
  name: string
): PackageJson {
  return pipe(
    packageJson.peerDependencies,
    Record.deleteAt(name),
    (peerDependencies) => ({ ...packageJson, peerDependencies })
  );
}

function _removePeerDependencyDuplucates(
  packageJson: PackageJson
): PackageJson {
  return pipe(
    packageJson.dependencies,
    Record.keys,
    A.intersection(S.Eq)(pipe(packageJson.peerDependencies, Record.keys)),
    A.map(
      (a) => (packageJson: PackageJson) =>
        _removePeerDependencies(packageJson, a)
    ),
    A.reduce(packageJson, (acc, v) => v(acc))
  );
}

export function removePeerDependencyDuplucates(
  pathToPackage: string
): IOE.IOEither<Error, string> {
  return pipe(
    readPackageJson(pathToPackage),
    IOE.map((a) => _removePeerDependencyDuplucates(a)),
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
