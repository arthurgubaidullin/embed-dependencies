import { injectDependencies } from '@embed-dependencies/deps-injecting';
import { copyDist } from '@embed-dependencies/dist-copying';
import { fixPackageJson } from '@embed-dependencies/package-json';
import { ExecutorContext } from '@nrwl/devkit';
import { toError } from 'fp-ts/Either';
import { constVoid, pipe } from 'fp-ts/function';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { EmbedDependenciesExecutorSchema } from './schema';

export default async function runExecutor(
  options: EmbedDependenciesExecutorSchema,
  context: ExecutorContext
): Promise<{
  success: boolean;
}> {
  return await pipe(pipeline(options, context), (t) => t());
}

function pipeline(
  options: EmbedDependenciesExecutorSchema,
  context: ExecutorContext
): T.Task<{
  success: boolean;
}> {
  const sourcePath = join(context.cwd, options.sourceDist, context.projectName);
  const targetPath = join(context.cwd, options.outputPath);

  return pipe(
    copyDist(sourcePath, targetPath),
    time('copyDist', context),
    T.chain(() =>
      pipe(
        injectDependencies(context, targetPath),
        T.fromIO,
        time('injectDependencies', context)
      )
    ),
    T.chain(() =>
      pipe(
        targetPath,
        fixPackageJson,
        T.fromIO,
        time('fixPackageJson', context)
      )
    ),
    TE.chain(() =>
      pipe(
        async () => {
          process.chdir(targetPath);
          execSync('npm install');
        },
        time('npm install', context),
        (f) => TE.tryCatch(f, toError)
      )
    ),
    TE.map(() => ({ success: true })),
    TE.orElseFirstIOK((e) => () => console.error(e)),
    TE.mapLeft(() => ({ success: false })),
    TE.getOrElse(T.of)
  );
}

function time(
  functionName: string,
  options: Readonly<{ isVerbose: boolean }>
): <A>(t: T.Task<A>) => T.Task<A> {
  return (t) =>
    pipe(
      T.Do,
      T.bind('before', () => T.fromIO(performance.now)),
      T.bind('result', () => t),
      T.bind('after', () => T.fromIO(performance.now)),
      T.let('performance', ({ before, after }) => Math.floor(after - before)),
      T.let(
        'message',
        ({ performance }) =>
          `The \`${functionName}\` function took ${performance} milliseconds.`
      ),
      T.chainFirstIOK(({ message }) =>
        options.isVerbose ? () => console.log(message) : constVoid
      ),
      T.map((a) => a.result)
    );
}
