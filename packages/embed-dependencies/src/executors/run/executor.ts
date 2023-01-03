import { injectDependencies } from '@embed-dependencies/deps-injecting';
import { ExecutorContext } from '@nrwl/devkit';
import { pipe } from 'fp-ts/function';
import * as T from 'fp-ts/Task';
import { EmbedDependenciesExecutorSchema } from './schema';
import { pipeline } from './pipeline';

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
        injectDependencies: (t) =>
          pipe(injectDependencies(t)({ context }), T.fromIO),
      }),
    (t) => t()
  );
}
