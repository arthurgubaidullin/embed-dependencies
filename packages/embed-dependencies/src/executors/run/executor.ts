import { injectDependencies } from '@embed-dependencies/deps-injecting';
import { ExecutorContext } from '@nrwl/devkit';
import { pipe } from 'fp-ts/function';
import * as T from 'fp-ts/Task';
import { pipeline } from './pipeline';
import { EmbedDependenciesExecutorSchema } from './schema';

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
        injectDependencies: (a, b) =>
          pipe(injectDependencies(a, b), (f) => f({ context }), T.fromIO),
      }),
    (t) => t()
  );
}
