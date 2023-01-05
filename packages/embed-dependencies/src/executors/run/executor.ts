import * as npmPackInjector from '@embed-dependencies/npm-pack-injector';
import * as yalcInjector from '@embed-dependencies/yalc-injector';
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
        injectDependencies: pipe(
          options.injector === 'npm-pack'
            ? (a, b) =>
                pipe(npmPackInjector.injectDependencies(a, b), (f) =>
                  f({ context })
                )
            : (a, b) =>
                pipe(
                  yalcInjector.injectDependencies(a, b),
                  (f) => f({ context }),
                  T.fromIO
                )
        ),
      }),
    (t) => t()
  );
}
