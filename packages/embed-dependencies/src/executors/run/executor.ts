import { injectDependencies } from '@embed-dependencies/deps-injecting';
import { copyDist } from '@embed-dependencies/dist-copying';
import { fixPackageJson } from '@embed-dependencies/package-json';
import { ExecutorContext } from '@nrwl/devkit';
import { toError } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as T from 'fp-ts/Task';
import * as RT from 'fp-ts/ReaderTask';
import * as TE from 'fp-ts/TaskEither';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { EmbedDependenciesExecutorSchema } from './schema';
import { time } from './time';

export default async function runExecutor(
  options: EmbedDependenciesExecutorSchema,
  context: ExecutorContext
): Promise<{
  success: boolean;
}> {
  return await pipe(
    pipeline(options),
    (rt) =>
      rt({
        context,
        injectDependencies: (t) => T.fromIO(injectDependencies(context, t)),
      }),
    (t) => t()
  );
}

export interface InjectDependencies {
  (targetPackage: string): T.Task<void>;
}

function pipeline(
  options: EmbedDependenciesExecutorSchema
): RT.ReaderTask<
  { context: ExecutorContext; injectDependencies: InjectDependencies },
  { success: boolean }
> {
  return (P) => {
    const sourcePath = join(
      P.context.cwd,
      options.sourceDist,
      P.context.projectName
    );
    const targetPath = join(P.context.cwd, options.outputPath);
    return pipe(
      copyDist(sourcePath, targetPath),
      time('copyDist', P.context),
      T.chain(() =>
        pipe(
          P.injectDependencies(targetPath),
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
