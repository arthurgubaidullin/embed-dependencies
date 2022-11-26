import { injectDependencies } from '@embed-dependencies/deps-injecting';
import { copyDist } from '@embed-dependencies/dist-copying';
import { removePeerDependencyDuplucates } from '@embed-dependencies/package-json';
import { ExecutorContext } from '@nrwl/devkit';
import { pipe } from 'fp-ts/lib/function';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { join } from 'node:path';
import { EmbedDependenciesExecutorSchema } from './schema';

const SOURCE_DIST = 'dist/packages';
const TARGET_DIST = 'dist-with-deps';

export default async function runExecutor(
  options: EmbedDependenciesExecutorSchema,
  context: ExecutorContext
) {
  console.log('Executor ran for EmbedDependencies', options);
  const sourcePath = join(context.cwd, SOURCE_DIST, context.projectName);
  const targetPath = join(context.cwd, TARGET_DIST, context.projectName);

  return await pipe(
    copyDist(sourcePath, targetPath),
    T.chain(() => T.fromIO(injectDependencies(context, targetPath))),
    T.chain(() => T.fromIO(removePeerDependencyDuplucates(targetPath))),
    TE.fold(
      () => T.of({ success: false }),
      () => T.of({ success: true })
    ),
    (t) => t()
  );
}
