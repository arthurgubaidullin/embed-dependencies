export interface EmbedDependenciesExecutorSchema {
  outputPath: string;
  sourceDist: string;
  injector: 'yalc' | 'npm-pack';
}
