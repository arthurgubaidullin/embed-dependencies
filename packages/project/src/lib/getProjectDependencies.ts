import {
  ExecutorContext,
  ProjectGraph,
  ProjectGraphProjectNode,
} from '@nrwl/devkit';
import { identity, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as RA from 'fp-ts/ReadonlyArray';
import * as RS from 'fp-ts/ReadonlySet';
import * as S from 'fp-ts/string';
import * as path from 'path';
import { Eq, eqStrict } from 'fp-ts/Eq';
import * as Ord from 'fp-ts/Ord';

export function getProjectDependencies(
  context: ExecutorContext
): readonly string[] {
  const EqProjectGraphProjectNode = eqStrict as Eq<ProjectGraphProjectNode>;
  const OrdProjectGraphProjectNode = Ord.contramap(
    (a: ProjectGraphProjectNode) => a.name
  )(S.Ord);
  const iter = (
    projectGraph: ProjectGraph,
    projectName: string,
    projects: ReadonlySet<ProjectGraphProjectNode>
  ): ReadonlySet<ProjectGraphProjectNode> =>
    pipe(
      projectGraph.dependencies[projectName],
      RA.map((a) => projectGraph.nodes[a.target]),
      RA.map(O.fromNullable),
      RA.compact,
      RS.fromReadonlyArray(EqProjectGraphProjectNode),
      RS.difference(EqProjectGraphProjectNode)(projects),
      RS.reduce(OrdProjectGraphProjectNode)(projects, (acc, v) =>
        acc.has(v)
          ? acc
          : iter(
              projectGraph,
              v.name,
              RS.insert(EqProjectGraphProjectNode)(v)(acc)
            )
      )
    );

  return pipe(
    O.Do,
    O.bind('projectName', () => O.fromNullable(context.projectName)),
    O.bind('projectGraph', () => O.fromNullable(context.projectGraph)),
    O.map(({ projectName, projectGraph }) =>
      pipe(
        iter(projectGraph, projectName, new Set()),
        RS.toReadonlyArray(OrdProjectGraphProjectNode),
        RA.map((a) => path.join(context.cwd, 'dist', a.data['root']))
      )
    ),
    O.fold(() => [], identity)
  );
}
