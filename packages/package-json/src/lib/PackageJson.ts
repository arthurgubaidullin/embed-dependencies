import * as A from 'fp-ts/Array';
import * as RA from 'fp-ts/ReadonlyArray';
import * as E from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import * as IO from 'fp-ts/IO';
import * as IOE from 'fp-ts/IOEither';
import * as Json from 'fp-ts/Json';
import * as Record from 'fp-ts/Record';
import * as S from 'fp-ts/string';
import { readFileSync, writeFileSync } from 'fs';
import * as t from 'io-ts';
import { failure } from 'io-ts/PathReporter';
import { join } from 'path';

type PackageJson = t.TypeOf<typeof PackageJson>;

const PackageJson = t.readonly(
  t.intersection([
    t.type({
      name: t.string,
      peerDependencies: t.record(t.string, t.string),
      dependencies: t.record(t.string, t.string),
    }),
    t.partial({
      bundledDependencies: t.readonlyArray(t.string),
    }),
  ])
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

function updateBundledDependencies(packageJson: PackageJson): PackageJson {
  return pipe(
    packageJson.dependencies,
    Record.keys,
    RA.filter((k) => packageJson.dependencies[k].startsWith('file:')),
    RA.concat(packageJson.bundledDependencies ?? []),
    (bundledDependencies) => ({ ...packageJson, bundledDependencies })
  );
}

function removePeerDependencyDuplucates(packageJson: PackageJson): PackageJson {
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

export function fixPackageJson(
  pathToPackage: string
): IOE.IOEither<Error, string> {
  return pipe(
    readPackageJson(pathToPackage),
    IOE.map((a) => removePeerDependencyDuplucates(a)),
    IOE.map((a) => updateBundledDependencies(a)),
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
