import { yalcClient } from './YalcClient';

describe('yalcClient', () => {
  it('should work', () => {
    expect(yalcClient()).toEqual('yalc-client');
  });
});
