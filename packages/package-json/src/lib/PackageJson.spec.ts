import { packageJson } from './PackageJson';

describe('packageJson', () => {
  it('should work', () => {
    expect(packageJson()).toEqual('package-json');
  });
});
