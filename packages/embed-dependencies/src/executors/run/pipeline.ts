import { copyDist } from '@embed-dependencies/dist-copying';
import { fixPackageJson } from '@embed-dependencies/package-json-program';
import { getProjectDependencies } from '@embed-dependencies/project';
import { ExecutorContext } from '@nrwl/devkit';
import { toError } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as RT from 'fp-ts/ReaderTask';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { EmbedDependenciesExecutorSchema } from './schema';
import { time } from './time';

export interface InjectDependencies {
  (targetPackage: string, dependencies: readonly string[]): T.Task<void>;
}

export function pipeline(
  options: EmbedDependenciesExecutorSchema
): RT.ReaderTask<
  { context: ExecutorContext; injectDependencies: InjectDependencies },
  { success: boolean }
> {
  return (P) => {
    const sourcePath = join(
      P.context.cwd,
      P.context.workspace.projects[P.context.projectName].targets['build']
        .options['outputPath']
    );
    const targetPath = join(P.context.cwd, options.outputPath);
    return pipe(
      copyDist(sourcePath, targetPath),
      time('copyDist', P.context),
      T.chain(() =>
        pipe(
          P.injectDependencies(targetPath, getProjectDependencies(P.context)),
          time('injectDependencies', P.context)
        )
      ),
      T.chain(() =>
        pipe(
          targetPath,
          fixPackageJson,
          T.fromIO,
          time('fixPackageJson', P.context)
        )
      ),
      TE.chain(() =>
        pipe(
          async () => {
            process.chdir(targetPath);
            execSync('npm install');
          },
          time('npm install', P.context),
          (f) => TE.tryCatch(f, toError)
        )
      ),
      TE.map(() => ({ success: true })),
      TE.orElseFirstIOK((e) => () => console.error(e)),
      TE.mapLeft(() => ({ success: false })),
      TE.getOrElse(T.of)
    );
  };
}
