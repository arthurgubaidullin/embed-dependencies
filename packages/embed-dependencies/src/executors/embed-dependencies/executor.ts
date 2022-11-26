import { EmbedDependenciesExecutorSchema } from './schema';

export default async function runExecutor(
  options: EmbedDependenciesExecutorSchema,
) {
  console.log('Executor ran for EmbedDependencies', options);
  return {
    success: true
  };
}

